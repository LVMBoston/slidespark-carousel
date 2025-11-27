import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    console.log('Converting PPTX:', filePath);

    const cloudConvertApiKey = Deno.env.get('CLOUDCONVERT_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!cloudConvertApiKey) {
      throw new Error('CLOUDCONVERT_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('presentations')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    console.log('File downloaded successfully');

    // Create a job with CloudConvert
    const createJobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudConvertApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: {
          'upload-pptx': {
            operation: 'import/upload',
          },
          'convert-to-images': {
            operation: 'convert',
            input: 'upload-pptx',
            output_format: 'png',
            input_format: 'pptx',
            pages: 'all',
            pixel_density: 144,
          },
          'export-images': {
            operation: 'export/url',
            input: 'convert-to-images',
          },
        },
      }),
    });

    if (!createJobResponse.ok) {
      const errorText = await createJobResponse.text();
      console.error('CloudConvert job creation failed:', errorText);
      throw new Error(`Failed to create CloudConvert job: ${errorText}`);
    }

    const jobData = await createJobResponse.json();
    console.log('Job created:', jobData.data.id);

    // Upload the file to CloudConvert
    const uploadTask = jobData.data.tasks.find((task: any) => task.name === 'upload-pptx');
    const uploadUrl = uploadTask.result.form.url;
    const uploadParameters = uploadTask.result.form.parameters;

    // Extract filename from path (remove timestamp prefix if present)
    const originalFileName = filePath.includes('-') 
      ? filePath.substring(filePath.indexOf('-') + 1) 
      : filePath;
    
    const formData = new FormData();
    Object.entries(uploadParameters).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    // Create a File object with proper filename so CloudConvert accepts it
    const file = new File([fileData], originalFileName, { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    formData.append('file', file);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', errorText);
      throw new Error(`Failed to upload file: ${errorText}`);
    }

    console.log('File uploaded to CloudConvert');

    // Wait for the job to complete
    let jobStatus = jobData.data;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait

    while (jobStatus.status !== 'finished' && jobStatus.status !== 'error' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
        headers: {
          'Authorization': `Bearer ${cloudConvertApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        console.error('Status check failed');
        throw new Error('Failed to check job status');
      }

      jobStatus = (await statusResponse.json()).data;
      console.log('Job status:', jobStatus.status);
    }

    if (jobStatus.status === 'error') {
      console.error('Job failed:', jobStatus);
      throw new Error('CloudConvert job failed');
    }

    if (jobStatus.status !== 'finished') {
      throw new Error('Job timeout');
    }

    // Get the export task
    const exportTask = jobStatus.tasks.find((task: any) => task.name === 'export-images');
    const imageFiles = exportTask.result.files;

    console.log(`Conversion complete. Generated ${imageFiles.length} images`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: imageFiles,
        jobId: jobData.data.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in convert-pptx function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
