// supabase/functions/get-download-url/index.ts
//
// Supabase Edge Function to generate pre-signed download URLs
// 
// SETUP REQUIRED:
// 1. Configure secrets in Supabase Dashboard → Settings → Edge Functions → Secrets
// 2. See BACKEND_SETUP.md for detailed instructions
//

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ============================================================================
// CONFIGURATION - Update these or use environment variables
// ============================================================================

const STORAGE_PROVIDER = Deno.env.get('STORAGE_PROVIDER') || 'mock'; // 'aws', 'gcs', 'r2', or 'mock'
const BUCKET_NAME = Deno.env.get('BUCKET_NAME') || 'my-bucket';
const URL_EXPIRY_SECONDS = parseInt(Deno.env.get('URL_EXPIRY_SECONDS') || '3600'); // 1 hour default

// AWS S3 / Cloudflare R2
const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';
const S3_ENDPOINT = Deno.env.get('S3_ENDPOINT'); // For R2: https://<account_id>.r2.cloudflarestorage.com

// Google Cloud Storage
const GCS_SERVICE_ACCOUNT_JSON = Deno.env.get('GCS_SERVICE_ACCOUNT_JSON');

// ============================================================================
// CORS Headers
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const filePath = url.searchParams.get('file');

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing "file" parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize file path
    const sanitizedPath = sanitizeFilePath(filePath);

    // Generate signed URL based on provider
    let signedUrl: string;

    switch (STORAGE_PROVIDER) {
      case 'aws':
      case 'r2':
        signedUrl = await generateS3SignedUrl(sanitizedPath);
        break;
      case 'gcs':
        signedUrl = await generateGCSSignedUrl(sanitizedPath);
        break;
      case 'mock':
      default:
        signedUrl = generateMockUrl(sanitizedPath);
        break;
    }

    return new Response(
      JSON.stringify({ url: signedUrl, expiresIn: URL_EXPIRY_SECONDS }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating signed URL:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate download URL' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize file path to prevent directory traversal
 */
function sanitizeFilePath(path: string): string {
  // Remove leading slashes and normalize
  let sanitized = path.replace(/^\/+/, '');
  
  // Prevent directory traversal
  sanitized = sanitized.replace(/\.\./g, '');
  
  // Remove any double slashes
  sanitized = sanitized.replace(/\/+/g, '/');
  
  return sanitized;
}

/**
 * Generate mock URL for testing (no actual storage connection)
 */
function generateMockUrl(filePath: string): string {
  const mockToken = btoa(`${filePath}:${Date.now()}`);
  return `https://mock-storage.example.com/${BUCKET_NAME}/${filePath}?token=${mockToken}&expires=${Date.now() + URL_EXPIRY_SECONDS * 1000}`;
}

/**
 * Generate AWS S3 or Cloudflare R2 pre-signed URL
 * 
 * NOTE: This is a simplified implementation. For production, use the official AWS SDK:
 * import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
 * import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
 */
async function generateS3SignedUrl(filePath: string): Promise<string> {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
  }

  // For a real implementation, use the AWS SDK:
  //
  // import { S3Client, GetObjectCommand } from 'npm:@aws-sdk/client-s3';
  // import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';
  //
  // const client = new S3Client({
  //   region: AWS_REGION,
  //   credentials: {
  //     accessKeyId: AWS_ACCESS_KEY_ID,
  //     secretAccessKey: AWS_SECRET_ACCESS_KEY,
  //   },
  //   ...(S3_ENDPOINT && { endpoint: S3_ENDPOINT }),
  // });
  //
  // const command = new GetObjectCommand({
  //   Bucket: BUCKET_NAME,
  //   Key: filePath,
  // });
  //
  // return await getSignedUrl(client, command, { expiresIn: URL_EXPIRY_SECONDS });

  // Placeholder - replace with actual SDK implementation
  throw new Error('S3 signing not implemented. See code comments for implementation guide.');
}

/**
 * Generate Google Cloud Storage signed URL
 *
 * NOTE: This is a simplified implementation. For production, use the official GCS library.
 */
async function generateGCSSignedUrl(filePath: string): Promise<string> {
  if (!GCS_SERVICE_ACCOUNT_JSON) {
    throw new Error('GCS credentials not configured. Set GCS_SERVICE_ACCOUNT_JSON.');
  }

  // For a real implementation, use the GCS library:
  //
  // import { Storage } from 'npm:@google-cloud/storage';
  //
  // const credentials = JSON.parse(GCS_SERVICE_ACCOUNT_JSON);
  // const storage = new Storage({ credentials });
  //
  // const [url] = await storage
  //   .bucket(BUCKET_NAME)
  //   .file(filePath)
  //   .getSignedUrl({
  //     version: 'v4',
  //     action: 'read',
  //     expires: Date.now() + URL_EXPIRY_SECONDS * 1000,
  //   });
  //
  // return url;

  // Placeholder - replace with actual SDK implementation
  throw new Error('GCS signing not implemented. See code comments for implementation guide.');
}
