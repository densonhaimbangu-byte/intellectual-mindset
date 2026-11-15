-- 1. Storage: visibility-aware read access
DROP POLICY IF EXISTS "Anyone can read store files" ON storage.objects;

CREATE POLICY "Public can read published product images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.is_visible = true AND p.image_url = storage.objects.name
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

CREATE POLICY "Admin can read store files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = ANY (ARRAY['product-images','documents'])
  AND public.has_role(auth.uid(), 'admin')
);

-- 2. spend_card: restrict to the caller's own card
CREATE OR REPLACE FUNCTION public.spend_card(_card_number text, _cvv text, _product_id uuid, _quantity integer DEFAULT 1, _color text DEFAULT NULL::text, _size text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c public.customer_cards;
  p public.products;
  qty integer := GREATEST(COALESCE(_quantity, 1), 1);
  total numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Please sign in to pay with your card');
  END IF;

  SELECT * INTO p FROM public.products WHERE id = _product_id AND is_visible = true;
  IF p.id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'This product is not available');
  END IF;

  total := round(p.price * qty, 2);

  SELECT * INTO c FROM public.customer_cards
    WHERE card_number = regexp_replace(COALESCE(_card_number, ''), '\s', '', 'g')
      AND cvv = trim(COALESCE(_cvv, ''))
      AND user_id = auth.uid()
    FOR UPDATE;

  IF c.id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Card number or CVV is incorrect');
  END IF;

  IF c.balance < total THEN
    RETURN json_build_object('ok', false, 'error', 'Not enough credit on this card');
  END IF;

  UPDATE public.customer_cards SET balance = balance - total WHERE id = c.id;

  INSERT INTO public.card_transactions
    (card_id, buyer_user_id, product_id, product_name, category, color, size, quantity, amount, currency)
  VALUES (c.id, auth.uid(), p.id, p.name, p.category, NULLIF(_color, ''), NULLIF(_size, ''), qty, total, p.currency);

  RETURN json_build_object('ok', true, 'amount', total, 'balance', c.balance - total);
END;
$function$;

-- 3. Keep definer functions off anon/PUBLIC
REVOKE ALL ON FUNCTION public.spend_card(text, text, uuid, integer, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.issue_my_card(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_add_credit(uuid, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_card(text, text, uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_my_card(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_credit(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.grant_owner_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;