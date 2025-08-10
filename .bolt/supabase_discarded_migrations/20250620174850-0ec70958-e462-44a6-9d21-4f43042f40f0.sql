
-- Create storage buckets for image uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('images', 'images', true),
  ('event-photos', 'event-photos', true),
  ('bride-family', 'bride-family', true),
  ('groom-family', 'groom-family', true),
  ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the images bucket
CREATE POLICY "Anyone can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create RLS policies for event-photos bucket
CREATE POLICY "Anyone can view event photos" ON storage.objects
FOR SELECT USING (bucket_id = 'event-photos');

CREATE POLICY "Authenticated users can upload event photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'event-photos' AND auth.role() = 'authenticated');

-- Create RLS policies for bride-family bucket
CREATE POLICY "Anyone can view bride family photos" ON storage.objects
FOR SELECT USING (bucket_id = 'bride-family');

CREATE POLICY "Authenticated users can upload bride family photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'bride-family' AND auth.role() = 'authenticated');

-- Create RLS policies for groom-family bucket
CREATE POLICY "Anyone can view groom family photos" ON storage.objects
FOR SELECT USING (bucket_id = 'groom-family');

CREATE POLICY "Authenticated users can upload groom family photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'groom-family' AND auth.role() = 'authenticated');

-- Create RLS policies for gallery bucket
CREATE POLICY "Anyone can view gallery photos" ON storage.objects
FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can upload gallery photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');
