-- Create storage bucket for wish images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wish-images', 'wish-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for wish-images bucket
CREATE POLICY "Anyone can view wish images" ON storage.objects
FOR SELECT USING (bucket_id = 'wish-images');

CREATE POLICY "Authenticated users can upload wish images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'wish-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update wish images" ON storage.objects
FOR UPDATE USING (bucket_id = 'wish-images');

CREATE POLICY "Users can delete wish images" ON storage.objects
FOR DELETE USING (bucket_id = 'wish-images');