/*
# Auto-create profile on signup

1. Changes
   - Adds a trigger function `handle_new_user()` that inserts a row into
     `profiles` whenever a new auth.users row is created.
   - Reads `raw_user_meta_data` for role, first_name, last_name, phone, country, city.
   - Defaults role to 'customer' when not specified.
   - Also inserts a matching row into `customers` or `vendors` based on role.
2. Security
   - The function runs as SECURITY DEFINER so it can write to profiles/customers/vendors
     even though the caller (the signup process) is anon.
   - search_path set to public for safety.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');

  INSERT INTO public.profiles (id, role, email, first_name, last_name, phone, country, city)
  VALUES (
    new.id,
    v_role,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city'
  );

  IF v_role = 'customer' THEN
    INSERT INTO public.customers (id) VALUES (new.id);
  ELSIF v_role = 'vendor' THEN
    INSERT INTO public.vendors (
      id, business_name, owner_name, business_email, phone, country,
      business_address, business_category, tax_number, logo_url, id_url
    ) VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'business_name', 'New Business'),
      new.raw_user_meta_data->>'first_name',
      COALESCE(new.raw_user_meta_data->>'business_email', new.email),
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'country',
      new.raw_user_meta_data->>'business_address',
      new.raw_user_meta_data->>'business_category',
      new.raw_user_meta_data->>'tax_number',
      new.raw_user_meta_data->>'logo_url',
      new.raw_user_meta_data->>'id_url'
    );
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
