DROP POLICY IF EXISTS "Public can read published product images" ON storage.objects;
CREATE POLICY "Public can read published product images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.is_visible = true
        AND (p.image_url = storage.objects.name OR storage.objects.name = ANY (p.gallery))
    )
  );