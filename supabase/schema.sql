-- Garage Fong booking system. Run once in the Supabase SQL editor.
-- Appointments are slot-based (opening hours, service duration, number of bays).
-- Products are reserved for pickup (stock is reduced atomically).
create extension if not exists pgcrypto;

create table public.settings (
  id int primary key default 1 check (id = 1),
  bays int not null default 2,               -- cars worked on at the same time. CONFIRM with owner.
  slot_step_min int not null default 30,     -- start-time interval offered to customers
  min_notice_hours int not null default 2,
  max_days_ahead int not null default 45
);
insert into public.settings default values;

create table public.admin_emails (email text primary key);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_min int not null check (duration_min between 15 and 480),
  price_mur numeric(10,2),                   -- null = "quoted after inspection"
  active boolean not null default true
);

-- weekday follows Postgres: 0 = Sunday ... 6 = Saturday. Times are Mauritius local time.
create table public.opening_windows (
  id serial primary key,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_mur numeric(10,2),                   -- null = "price confirmed on call"
  stock int not null default 0 check (stock >= 0),
  active boolean not null default true
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  service_id uuid not null references public.services,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  name text not null, phone text not null, car text not null, notes text,
  status text not null default 'pending' check (status in ('pending','confirmed','done','cancelled','no_show')),
  created_at timestamptz not null default now()
);
create index on public.appointments (starts_at);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  name text not null, phone text not null, note text,
  status text not null default 'new' check (status in ('new','ready','collected','cancelled')),
  created_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id uuid references public.products on delete set null,
  product_name text not null,
  qty int not null check (qty between 1 and 20),
  unit_price_mur numeric(10,2)
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_emails where email = auth.jwt() ->> 'email')
$$;

-- Free start times for a service on a date (never exposes customer data).
create or replace function public.available_slots(p_service uuid, p_date date)
returns table(slot timestamptz) language plpgsql stable security definer set search_path = public as $$
declare
  s settings; dur int; tz constant text := 'Indian/Mauritius'; w record; t timestamp; t_tz timestamptz;
begin
  select * into s from settings;
  select duration_min into dur from services where id = p_service and active;
  if dur is null then return; end if;
  if p_date < (now() at time zone tz)::date or p_date > (now() at time zone tz)::date + s.max_days_ahead then return; end if;
  for w in select * from opening_windows where weekday = extract(dow from p_date)::int order by start_time loop
    t := p_date + w.start_time;
    while t + make_interval(mins => dur) <= p_date + w.end_time loop
      t_tz := t at time zone tz;
      if t_tz >= now() + make_interval(hours => s.min_notice_hours)
         and (select count(*) from appointments a
              where a.status in ('pending','confirmed')
                and a.starts_at < t_tz + make_interval(mins => dur)
                and a.ends_at > t_tz) < s.bays then
        slot := t_tz; return next;
      end if;
      t := t + make_interval(mins => s.slot_step_min);
    end loop;
  end loop;
end $$;

create or replace function public.book_appointment(
  p_service uuid, p_start timestamptz, p_name text, p_phone text, p_car text, p_notes text)
returns uuid language plpgsql security definer set search_path = public as $$
declare dur int; new_id uuid;
begin
  if char_length(trim(p_name)) < 2 or char_length(trim(p_phone)) < 6 or char_length(trim(p_car)) < 2
     or char_length(coalesce(p_notes,'')) > 1000 then raise exception 'invalid_details'; end if;
  perform pg_advisory_xact_lock(hashtext('book_appointment'));   -- serialises bookings: no double booking
  if not exists (select 1 from available_slots(p_service, (p_start at time zone 'Indian/Mauritius')::date) a where a.slot = p_start) then
    raise exception 'slot_unavailable';
  end if;
  select duration_min into dur from services where id = p_service;
  insert into appointments (user_id, service_id, starts_at, ends_at, name, phone, car, notes)
  values (auth.uid(), p_service, p_start, p_start + make_interval(mins => dur), trim(p_name), trim(p_phone), trim(p_car), nullif(trim(p_notes),''))
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.cancel_my_appointment(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update appointments set status = 'cancelled'
  where id = p_id and user_id = auth.uid() and starts_at > now() and status in ('pending','confirmed')
$$;

create or replace function public.place_order(p_name text, p_phone text, p_note text, p_items jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare oid uuid; it jsonb; pid uuid; q int; p products;
begin
  if char_length(trim(p_name)) < 2 or char_length(trim(p_phone)) < 6 then raise exception 'invalid_details'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'empty_order'; end if;
  insert into orders (user_id, name, phone, note) values (auth.uid(), trim(p_name), trim(p_phone), nullif(trim(p_note),'')) returning id into oid;
  for it in select * from jsonb_array_elements(p_items) loop
    pid := (it ->> 'product_id')::uuid; q := (it ->> 'qty')::int;
    if q < 1 or q > 20 then raise exception 'invalid_details'; end if;
    update products set stock = stock - q where id = pid and active and stock >= q returning * into p;
    if not found then raise exception 'out_of_stock'; end if;
    insert into order_items (order_id, product_id, product_name, qty, unit_price_mur) values (oid, p.id, p.name, q, p.price_mur);
  end loop;
  return oid;
end $$;

create or replace function public.admin_set_order_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare old text;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select status into old from orders where id = p_id;
  if p_status = 'cancelled' and old <> 'cancelled' then   -- put stock back
    update products p set stock = p.stock + i.qty from order_items i where i.order_id = p_id and i.product_id = p.id;
  end if;
  update orders set status = p_status where id = p_id;
end $$;

-- Row level security
alter table public.settings enable row level security;
alter table public.admin_emails enable row level security;
alter table public.services enable row level security;
alter table public.opening_windows enable row level security;
alter table public.products enable row level security;
alter table public.appointments enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "own admin row" on public.admin_emails for select to authenticated using (email = auth.jwt() ->> 'email');
create policy "public read services" on public.services for select using (active);
create policy "admin all services" on public.services for all to authenticated using (is_admin()) with check (is_admin());
create policy "public read hours" on public.opening_windows for select using (true);
create policy "admin all hours" on public.opening_windows for all to authenticated using (is_admin()) with check (is_admin());
create policy "public read products" on public.products for select using (active);
create policy "admin all products" on public.products for all to authenticated using (is_admin()) with check (is_admin());
create policy "own or admin appointments" on public.appointments for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "admin update appointments" on public.appointments for update to authenticated using (is_admin());
create policy "own or admin orders" on public.orders for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "own or admin order items" on public.order_items for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin())));
create policy "admin settings" on public.settings for all to authenticated using (is_admin()) with check (is_admin());

-- Starter data. PLACEHOLDERS: confirm durations, bays and products with the owner (edit in /admin).
insert into public.opening_windows (weekday, start_time, end_time) values
  (1,'08:00','12:00'),(1,'13:00','17:00'),(2,'08:00','12:00'),(2,'13:00','17:00'),
  (3,'08:00','12:00'),(3,'13:00','17:00'),(4,'08:00','12:00'),(4,'13:00','17:00'),
  (5,'08:00','12:00'),(5,'13:00','17:00'),(6,'08:00','12:00');
insert into public.services (name, description, duration_min) values
  ('General servicing', 'Oil, filters and a check of the main wear items.', 120),
  ('Fault diagnosis', 'We find out what is wrong and explain it before any work starts.', 60),
  ('Repair inspection and quote', 'Bring the car in and we tell you what it needs.', 60);
insert into public.products (name, description, stock) values
  ('Engine oil (1 L)', 'Ask us which grade suits your car.', 20),
  ('Oil filter', 'Tell us your car model when you collect.', 10),
  ('Wiper blades (pair)', null, 10);

-- Then: Authentication > Users > add the owner, and run:
-- insert into public.admin_emails values ('owner@example.com');
