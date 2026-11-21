-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Properties
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  title text NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('pg','flat')),
  locality text NOT NULL,
  address text,
  rent integer NOT NULL CHECK (rent > 0),
  deposit integer NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  bhk text,
  sharing text,
  gender text NOT NULL DEFAULT 'any' CHECK (gender IN ('boys','girls','any')),
  furnishing text NOT NULL DEFAULT 'semi' CHECK (furnishing IN ('furnished','semi','unfurnished')),
  food_included boolean NOT NULL DEFAULT false,
  amenities text[] NOT NULL DEFAULT '{}',
  description text,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX properties_type_locality_idx ON public.properties (listing_type, locality);
CREATE INDEX properties_owner_idx ON public.properties (owner_id);

GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view available properties" ON public.properties FOR SELECT TO anon, authenticated USING (is_available = true);
CREATE POLICY "Owners view own properties" ON public.properties FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners add properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own properties" ON public.properties FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete own properties" ON public.properties FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Demo listings
INSERT INTO public.properties (title, listing_type, locality, address, rent, deposit, bhk, sharing, gender, furnishing, food_included, amenities, description, contact_name, contact_phone, images) VALUES
('Spacious 2BHK with city view near Baner Road', 'flat', 'Baner', 'Near Baner Road, Pune', 28000, 80000, '2 BHK', NULL, 'any', 'furnished', false, ARRAY['Parking','Lift','24x7 Security','Power Backup','Gym'], 'Bright 2BHK on the 9th floor with a large living room, modular kitchen and two balconies. Walking distance to Baner Road cafes and offices.', 'Rahul Deshmukh', '9822012345', ARRAY['/images/flat-1.jpg','/images/flat-2.jpg']),
('Boys PG – twin sharing near Hinjewadi Phase 1', 'pg', 'Hinjewadi', 'Phase 1, Hinjewadi, Pune', 8500, 10000, NULL, 'Double', 'boys', 'furnished', true, ARRAY['WiFi','Meals','Laundry','Housekeeping','Power Backup'], 'Clean twin-sharing rooms with study desks. Breakfast and dinner included. 5 minutes from Infosys and Wipro campuses.', 'Sanjay Patil', '9890123456', ARRAY['/images/pg-1.jpg']),
('Girls PG – single room in Kothrud', 'pg', 'Kothrud', 'Near Karishma Society, Kothrud, Pune', 12000, 15000, NULL, 'Single', 'girls', 'furnished', true, ARRAY['WiFi','Meals','CCTV','Housekeeping','Hot Water'], 'Safe and homely girls PG with single rooms, home-cooked Maharashtrian meals and a warden on site.', 'Meena Kulkarni', '9765432109', ARRAY['/images/pg-2.jpg']),
('Cozy 1BHK with balcony in Viman Nagar', 'flat', 'Viman Nagar', 'Off Viman Nagar Road, Pune', 19000, 50000, '1 BHK', NULL, 'any', 'semi', false, ARRAY['Parking','Lift','Balcony','Security'], 'Well-kept 1BHK with a green balcony, close to Phoenix Marketcity and the airport.', 'Anil Joshi', '9823456780', ARRAY['/images/flat-2.jpg','/images/flat-1.jpg']),
('Co-living PG for working professionals, Kharadi', 'pg', 'Kharadi', 'EON IT Park Road, Kharadi, Pune', 11000, 11000, NULL, 'Double', 'any', 'furnished', false, ARRAY['WiFi','AC','Laundry','Housekeeping','Gym'], 'Modern co-living spaces next to EON IT Park. AC rooms, weekly cleaning and a shared lounge.', 'Priya Shah', '9881122334', ARRAY['/images/pg-1.jpg','/images/pg-2.jpg']),
('3BHK family flat in Wakad', 'flat', 'Wakad', 'Near Dange Chowk, Wakad, Pune', 32000, 100000, '3 BHK', NULL, 'any', 'semi', false, ARRAY['Parking','Lift','Swimming Pool','Clubhouse','Power Backup'], 'Large 3BHK in a gated society with pool and clubhouse. Good schools nearby; ideal for families.', 'Vikram Pawar', '9850011223', ARRAY['/images/flat-1.jpg']),
('Budget triple sharing PG near FC Road', 'pg', 'Shivajinagar', 'Near Fergusson College, Shivajinagar, Pune', 6000, 6000, NULL, 'Triple', 'boys', 'furnished', true, ARRAY['WiFi','Meals','Hot Water'], 'Affordable PG for students, walking distance to FC, BMCC and Modern College.', 'Ganesh More', '9604455667', ARRAY['/images/pg-1.jpg']),
('1RK studio near Hadapsar Magarpatta', 'flat', 'Hadapsar', 'Near Magarpatta City, Hadapsar, Pune', 11000, 30000, '1 RK', NULL, 'any', 'unfurnished', false, ARRAY['Parking','Security','Water Supply'], 'Compact 1RK with kitchen platform, ideal for a single working professional near Magarpatta.', 'Sunita Jadhav', '9767788990', ARRAY['/images/flat-2.jpg']);
