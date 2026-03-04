
-- Enums
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('farmer', 'buyer', 'distributor', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.product_category AS ENUM ('chicken', 'eggs', 'meat', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'picked_up', 'in_transit', 'delivered', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Role check function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1 $$;

-- Inventory
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  category product_category NOT NULL DEFAULT 'chicken',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pieces',
  price_per_unit DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  location TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  health_status TEXT DEFAULT 'healthy',
  vaccination_status TEXT,
  weight_kg DECIMAL(8,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order sequence and table
CREATE SEQUENCE IF NOT EXISTS order_seq START 1000;

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT 'ORD-' || LPAD(nextval('order_seq'::regclass)::TEXT, 6, '0'),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  farmer_id UUID NOT NULL REFERENCES auth.users(id),
  distributor_id UUID REFERENCES auth.users(id),
  status order_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_address TEXT,
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  distributor_id UUID NOT NULL REFERENCES auth.users(id),
  pickup_location TEXT,
  delivery_location TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "view_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "view_own_role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_view_roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Inventory policies
CREATE POLICY "view_inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "update_inventory" ON public.inventory FOR UPDATE TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "delete_inventory" ON public.inventory FOR DELETE TO authenticated USING (auth.uid() = farmer_id);

-- Orders policies
CREATE POLICY "buyer_view_orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "farmer_view_orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "dist_view_orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = distributor_id);
CREATE POLICY "admin_view_orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "buyer_create_orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "update_orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() IN (buyer_id, farmer_id, distributor_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Order items policies
CREATE POLICY "view_items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.farmer_id = auth.uid() OR o.distributor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)))
);
CREATE POLICY "insert_items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
);

-- Deliveries policies
CREATE POLICY "dist_view_del" ON public.deliveries FOR SELECT TO authenticated USING (auth.uid() = distributor_id);
CREATE POLICY "admin_view_del" ON public.deliveries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "dist_insert_del" ON public.deliveries FOR INSERT TO authenticated WITH CHECK (auth.uid() = distributor_id);
CREATE POLICY "dist_update_del" ON public.deliveries FOR UPDATE TO authenticated USING (auth.uid() = distributor_id);

-- Updated at function & triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER tr_profiles_ts BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_inventory_ts BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_orders_ts BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_deliveries_ts BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes
CREATE INDEX idx_inv_farmer ON public.inventory(farmer_id);
CREATE INDEX idx_inv_cat ON public.inventory(category);
CREATE INDEX idx_ord_buyer ON public.orders(buyer_id);
CREATE INDEX idx_ord_farmer ON public.orders(farmer_id);
CREATE INDEX idx_ord_status ON public.orders(status);
CREATE INDEX idx_del_dist ON public.deliveries(distributor_id);
