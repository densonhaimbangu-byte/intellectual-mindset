CREATE TABLE public.posters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  image_url text,
  link_url text,
  is_active boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.posters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posters TO authenticated;
GRANT ALL ON public.posters TO service_role;

ALTER TABLE public.posters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posted posters" ON public.posters
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admin can view all posters" ON public.posters
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert posters" ON public.posters
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update posters" ON public.posters
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete posters" ON public.posters
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER posters_updated_at BEFORE UPDATE ON public.posters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Poster images are viewable when posted" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images' AND EXISTS (
    SELECT 1 FROM public.posters p WHERE p.is_active = true AND p.image_url = storage.objects.name
  ));