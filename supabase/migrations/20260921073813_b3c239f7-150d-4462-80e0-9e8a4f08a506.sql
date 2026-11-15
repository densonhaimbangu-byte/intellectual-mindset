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

CREATE POLICY "Public can read published documents"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.is_visible = true AND d.file_url = storage.objects.name
  )
);

CREATE POLICY "Poster images are viewable when posted" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images' AND EXISTS (
    SELECT 1 FROM public.posters p WHERE p.is_active = true AND p.image_url = storage.objects.name
  ));

CREATE POLICY "Admin can read store files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = ANY (ARRAY['product-images','documents'])
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can upload store files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('product-images','documents') AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update store files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('product-images','documents') AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete store files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('product-images','documents') AND public.has_role(auth.uid(), 'admin'));