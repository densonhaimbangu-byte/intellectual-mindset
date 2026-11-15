-- points on cards
ALTER TABLE public.customer_cards ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;
ALTER TABLE public.card_transactions ADD COLUMN IF NOT EXISTS points_earned integer NOT NULL DEFAULT 0;
ALTER TABLE public.card_credits ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

-- orders (open to everyone, card optional)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  category text,
  color text,
  size text,
  quantity integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NAD',
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text,
  note text,
  payment_method text NOT NULL DEFAULT 'request',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin views all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers view own orders" ON public.orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin updates orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes orders" ON public.orders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- spend_card now awards 1 point per N$100 spent
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
  pts integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Please sign in to pay with your card');
  END IF;

  SELECT * INTO p FROM public.products WHERE id = _product_id AND is_visible = true;
  IF p.id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'This product is not available');
  END IF;

  total := round(p.price * qty, 2);
  pts := floor(total / 100)::int;

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

  UPDATE public.customer_cards
    SET balance = balance - total, points = points + pts
    WHERE id = c.id;

  INSERT INTO public.card_transactions
    (card_id, buyer_user_id, product_id, product_name, category, color, size, quantity, amount, currency, points_earned)
  VALUES (c.id, auth.uid(), p.id, p.name, p.category, NULLIF(_color, ''), NULLIF(_size, ''), qty, total, p.currency, pts);

  INSERT INTO public.orders
    (user_id, product_id, product_name, category, color, size, quantity, amount, currency, customer_name, phone, email, payment_method, status)
  VALUES (auth.uid(), p.id, p.name, p.category, NULLIF(_color, ''), NULLIF(_size, ''), qty, total, p.currency,
          c.full_name, COALESCE(c.phone, ''), c.email, 'card', 'paid');

  RETURN json_build_object('ok', true, 'amount', total, 'balance', c.balance - total, 'points_earned', pts, 'points', c.points + pts);
END;
$function$;

-- owner adds points whenever they want
CREATE OR REPLACE FUNCTION public.admin_add_points(_card_id uuid, _points integer, _note text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_points integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only the brand owner can add points';
  END IF;
  IF _points IS NULL OR _points = 0 THEN
    RAISE EXCEPTION 'Enter a number of points';
  END IF;

  UPDATE public.customer_cards
    SET points = GREATEST(points + _points, 0)
    WHERE id = _card_id
    RETURNING points INTO new_points;

  IF new_points IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  INSERT INTO public.card_credits (card_id, amount, points, note, created_by)
  VALUES (_card_id, 0, _points, COALESCE(NULLIF(_note, ''), 'Points added'), auth.uid());

  RETURN new_points;
END;
$function$;

-- owner converts points to credit (1 point = N$2)
CREATE OR REPLACE FUNCTION public.admin_redeem_points(_card_id uuid, _points integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c public.customer_cards;
  value numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only the brand owner can redeem points';
  END IF;

  SELECT * INTO c FROM public.customer_cards WHERE id = _card_id FOR UPDATE;
  IF c.id IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;
  IF _points IS NULL OR _points <= 0 OR _points > c.points THEN
    RAISE EXCEPTION 'Not enough points on this card';
  END IF;

  value := _points * 2;

  UPDATE public.customer_cards
    SET points = points - _points, balance = balance + value
    WHERE id = _card_id;

  INSERT INTO public.card_credits (card_id, amount, points, note, created_by)
  VALUES (_card_id, value, -_points, _points || ' points redeemed', auth.uid());

  RETURN json_build_object('points', c.points - _points, 'balance', c.balance + value);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_add_points(uuid, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_redeem_points(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_points(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_redeem_points(uuid, integer) TO authenticated;