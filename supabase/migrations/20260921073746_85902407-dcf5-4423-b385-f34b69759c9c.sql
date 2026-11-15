CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) IN ('densonhaimbangu@gmail.com', 'intellectualmindsetclothing@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  category text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  compare_price numeric(10,2),
  currency text NOT NULL DEFAULT 'NAD',
  image_url text,
  sizes text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  gallery text[] NOT NULL DEFAULT '{}'::text[],
  is_featured boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visible products" ON public.products FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "Admin can view all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view visible documents" ON public.documents FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "Admin can view all documents" ON public.documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update documents" ON public.documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete documents" ON public.documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin can insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete settings" ON public.site_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (key, value) VALUES
  ('announcement', 'FREE DELIVERY IN WINDHOEK ON ORDERS OVER N$800'),
  ('hero_kicker', 'NEW COLLECTION'),
  ('hero_title_line1', 'THINK DIFFERENT.'),
  ('hero_title_line2', 'WEAR THE MINDSET.'),
  ('hero_subtitle', 'Premium streetwear for those who build their own path.'),
  ('email', 'Intellectualmindsetclothing@gmail.com'),
  ('phone', '+264 857726474'),
  ('phone_alt', '+264857726474'),
  ('about', 'Intellectual Mindset Clothing is a Namibian streetwear label made for thinkers, builders and doers. Every piece is designed to be worn with intent.');

INSERT INTO public.products (name, category, description, price, image_url, sizes, is_featured, sort_order) VALUES
  ('MINDSET LOGO TEE - BLACK', 'tshirts', 'Heavyweight cotton tee with front logo print.', 350.00, NULL, ARRAY['S','M','L','XL','XXL'], true, 1),
  ('THINK DIFFERENT HOODIE - BLACK', 'hoodies', 'Brushed fleece hoodie with embroidered chest logo.', 750.00, NULL, ARRAY['S','M','L','XL','XXL'], true, 2),
  ('MINDSET CREW SOCKS - 2 PACK', 'socks', 'Ribbed crew socks with woven logo.', 120.00, NULL, ARRAY['One Size'], true, 3),
  ('MINDSET STICKER PACK', 'stickers', 'Weatherproof vinyl sticker pack of 5.', 60.00, NULL, ARRAY['One Size'], true, 4);

CREATE TABLE public.customer_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  card_number text NOT NULL UNIQUE,
  cvv text NOT NULL,
  card_title text NOT NULL DEFAULT 'Discount Member',
  is_owner_card boolean NOT NULL DEFAULT false,
  balance numeric NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.customer_cards TO authenticated;
GRANT ALL ON public.customer_cards TO service_role;
ALTER TABLE public.customer_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own card" ON public.customer_cards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin views all cards" ON public.customer_cards
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin updates cards" ON public.customer_cards
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes cards" ON public.customer_cards
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER customer_cards_updated_at
  BEFORE UPDATE ON public.customer_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.card_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.customer_cards(id) ON DELETE CASCADE,
  buyer_user_id uuid,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  category text,
  color text,
  size text,
  quantity integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'NAD',
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.card_transactions TO authenticated;
GRANT ALL ON public.card_transactions TO service_role;
ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own card activity" ON public.card_transactions
  FOR SELECT TO authenticated USING (
    buyer_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.customer_cards c WHERE c.id = card_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Admin views all card activity" ON public.card_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.card_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.customer_cards(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  points integer NOT NULL DEFAULT 0,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.card_credits TO authenticated;
GRANT ALL ON public.card_credits TO service_role;
ALTER TABLE public.card_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own top-ups" ON public.card_credits
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.customer_cards c WHERE c.id = card_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Admin views all top-ups" ON public.card_credits
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (is_visible = true);
CREATE POLICY "Admin can view all categories" ON public.categories
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update categories" ON public.categories
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete categories" ON public.categories
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.categories (slug, label, sort_order) VALUES
  ('hoodies', 'Hoodies', 1),
  ('tshirts', 'T-Shirts', 2),
  ('socks', 'Socks', 3),
  ('stickers', 'Stickers', 4);

CREATE TABLE public.orders (
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

CREATE OR REPLACE FUNCTION public.issue_my_card(_full_name text DEFAULT NULL, _phone text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  em text;
  existing uuid;
  num text;
  owner boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  SELECT id INTO existing FROM public.customer_cards WHERE user_id = uid;
  IF existing IS NOT NULL THEN
    UPDATE public.customer_cards
      SET full_name = COALESCE(NULLIF(_full_name, ''), full_name),
          phone = COALESCE(NULLIF(_phone, ''), phone)
      WHERE id = existing;
    RETURN existing;
  END IF;

  SELECT email INTO em FROM auth.users WHERE id = uid;
  owner := lower(COALESCE(em, '')) IN ('densonhaimbangu@gmail.com', 'intellectualmindsetclothing@gmail.com');

  LOOP
    num := '5312' || lpad((floor(random() * 1000000000000))::bigint::text, 12, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.customer_cards WHERE card_number = num);
  END LOOP;

  INSERT INTO public.customer_cards (user_id, full_name, email, phone, card_number, cvv, card_title, is_owner_card)
  VALUES (
    uid,
    COALESCE(NULLIF(_full_name, ''), split_part(COALESCE(em, 'member'), '@', 1)),
    em,
    NULLIF(_phone, ''),
    num,
    lpad((floor(random() * 1000))::int::text, 3, '0'),
    CASE WHEN owner THEN 'Mr Intellectual Mindset CEO' ELSE 'Discount Member' END,
    owner
  )
  RETURNING id INTO existing;

  RETURN existing;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.admin_add_credit(_card_id uuid, _amount numeric, _note text DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only the brand owner can add credit';
  END IF;
  IF _amount IS NULL OR _amount = 0 THEN
    RAISE EXCEPTION 'Enter an amount';
  END IF;

  UPDATE public.customer_cards
    SET balance = GREATEST(balance + _amount, 0)
    WHERE id = _card_id
    RETURNING balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  INSERT INTO public.card_credits (card_id, amount, note, created_by)
  VALUES (_card_id, _amount, NULLIF(_note, ''), auth.uid());

  RETURN new_balance;
END;
$$;

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

REVOKE ALL ON FUNCTION public.grant_owner_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.issue_my_card(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.spend_card(text, text, uuid, integer, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_add_credit(uuid, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_add_points(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_redeem_points(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_my_card(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_card(text, text, uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_credit(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_points(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_redeem_points(uuid, integer) TO authenticated;