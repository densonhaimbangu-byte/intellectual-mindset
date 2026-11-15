CREATE TABLE public.admin_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_secrets TO service_role;

ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_set_secret(_key text, _value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only the owner can change this setting';
  END IF;

  IF _value IS NULL OR btrim(_value) = '' THEN
    DELETE FROM public.admin_secrets WHERE key = _key;
  ELSE
    INSERT INTO public.admin_secrets (key, value, updated_at)
    VALUES (_key, btrim(_value), now())
    ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_secret_is_set(_key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only the owner can read this setting';
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.admin_secrets WHERE key = _key);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_secret(text, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.admin_secret_is_set(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_secret(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_secret_is_set(text) TO authenticated;