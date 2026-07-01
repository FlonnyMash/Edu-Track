-- Run in Supabase SQL Editor after tamagotchi_setup.sql
-- Gives is_admin users free shop purchases + self-grant coins in production builds

CREATE OR REPLACE FUNCTION public.grant_self_coins(p_amount INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_amount <= 0 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'Invalid coin amount';
  END IF;

  UPDATE public.profiles
  SET coins = coins + p_amount
  WHERE id = auth.uid()
  RETURNING coins INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_self_coins(INT) TO authenticated;

-- Admins skip coin deduction when buying
CREATE OR REPLACE FUNCTION public.buy_shop_item(p_item_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_price INT;
  v_balance INT;
  v_is_admin BOOLEAN;
  v_inventory_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT price INTO v_price
  FROM public.shop_items
  WHERE id = p_item_id;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_inventory
    WHERE user_id = v_user_id AND item_id = p_item_id
  ) THEN
    RAISE EXCEPTION 'Item already owned';
  END IF;

  SELECT coins, is_admin
  INTO v_balance, v_is_admin
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT COALESCE(v_is_admin, false) THEN
    IF v_balance < v_price THEN
      RAISE EXCEPTION 'Insufficient coins';
    END IF;

    UPDATE public.profiles
    SET coins = coins - v_price
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.user_inventory (user_id, item_id, is_equipped)
  VALUES (v_user_id, p_item_id, false)
  RETURNING id INTO v_inventory_id;

  RETURN v_inventory_id;
END;
$$;
