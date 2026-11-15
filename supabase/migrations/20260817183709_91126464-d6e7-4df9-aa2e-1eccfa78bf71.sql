-- ============ owner admin grant (new owner email) ============
CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) IN ('densonhaimbangu@gmail.com', 'intellectualmindsetclothing@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_owner_admin() FROM PUBLIC, anon, authenticated;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE lower(email) IN ('densonhaimbangu@gmail.com', 'intellectualmindsetclothing@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- ============ customer cards ============
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

-- ============ card transactions ============
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

-- ============ credit top-ups ============
CREATE TABLE public.card_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.customer_cards(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
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

-- ============ issue my card ============
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

REVOKE ALL ON FUNCTION public.issue_my_card(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_my_card(text, text) TO authenticated;

-- ============ spend with card ============
CREATE OR REPLACE FUNCTION public.spend_card(
  _card_number text,
  _cvv text,
  _product_id uuid,
  _quantity integer DEFAULT 1,
  _color text DEFAULT NULL,
  _size text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.spend_card(text, text, uuid, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_card(text, text, uuid, integer, text, text) TO authenticated;

-- ============ owner adds credit ============
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

REVOKE ALL ON FUNCTION public.admin_add_credit(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_credit(uuid, numeric, text) TO authenticated;