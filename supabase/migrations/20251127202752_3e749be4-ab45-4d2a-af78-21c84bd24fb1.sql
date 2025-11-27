-- Create policies for presentations bucket storage access

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public uploads to presentations" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from presentations" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from presentations" ON storage.objects;

-- Allow anyone to upload to presentations bucket
CREATE POLICY "Allow public uploads to presentations"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'presentations');

-- Allow anyone to read from presentations bucket (needed for conversion)
CREATE POLICY "Allow public reads from presentations"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'presentations');

-- Allow deletion of files in presentations bucket (cleanup)
CREATE POLICY "Allow public deletes from presentations"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'presentations');