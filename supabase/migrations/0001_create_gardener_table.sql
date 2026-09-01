-- Gardener join-form submissions ("Become a Gardener" screen).
-- Mirrors HomeSewa's workforce/career pattern (public insert-only form, admin
-- approval workflow) but tightens the RLS gap HomeSewa documents as known
-- debt in its own 0001_security_hardening.sql (workforce is left fully open
-- to the anon key because there's no per-row owner to key a policy on). This
-- table holds citizenship numbers, NID, phone, and home address for every
-- applicant, so instead anon only ever gets INSERT — no SELECT/UPDATE/DELETE.
-- Admin/BDM/Call Center review must go through a future service-role Edge
-- Function (same shape as HomeSewa's approve-professional), not this table
-- directly.

create table if not exists gardener (
  id uuid primary key default gen_random_uuid(),

  -- Personal info
  full_name text not null,
  phone text not null,
  alternative_phone text,
  foreign_returnee text not null
    check (foreign_returnee in ('No', 'Australia', 'Europe', 'Gulf', 'India', 'USA', 'Other')),
  citizenship_number text not null,
  issued_district text not null,
  email text,
  nid_number text,
  gender text not null check (gender in ('Male', 'Female')),
  blood_group text not null check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  emergency_contact_number text not null,
  emergency_contact_relation text not null
    check (emergency_contact_relation in ('Father', 'Mother', 'Son', 'Daughter', 'Husband', 'Wife')),

  -- Uploads: profile picture lives in the public "uploads" bucket (full URL);
  -- citizenship/NID is sensitive and lives in the private "id-documents"
  -- bucket, so only the storage PATH is stored here, never a public URL.
  citizenship_nid_path text not null,
  profile_picture_url text not null,

  -- Professional background
  academic_background text
    check (academic_background is null or academic_background in ('Literate', 'SLC/SEE', 'Diploma', 'Graduate', 'Post Graduate', 'Ph.D.')),
  has_training_certificate text check (has_training_certificate is null or has_training_certificate in ('Yes', 'No')),
  training_institute_name text,
  training_certificate_url text,
  experience_certificate_url text,
  years_experience numeric,
  area_of_expertise text[] not null default '{}',
  work_preference text not null check (work_preference in (
    'Hourly Basis ( 3 Hours in the Morning )',
    'Hourly Basis ( 3 Hours in the Evening )',
    'Daily Basis ( 7 Hours Daily )',
    'Weekly Basis ( 42 Hours Weekly )',
    'Monthly Basis ( 182 Hours Weekly )',
    'Part Time',
    'Any Time',
    'Other'
  )),
  languages_known text[] not null default '{}',
  personal_office_vehicle text[] not null default '{}',
  has_driving_license text[] not null default '{}',
  expected_working_city text[] not null default '{}',
  working_area text,

  -- Permanent address
  province text,
  district text,
  municipality text,
  ward text,

  -- Other details
  insurance_company_name text,
  insurance_policy_number text,
  referred_by_name text,
  referral_phone_number text,
  wants_advance_training text not null check (wants_advance_training in ('Yes', 'No')),
  how_did_you_know text not null check (how_did_you_know in (
    'Google Search', 'Registration DropZone', 'Facebook', 'Instagram',
    'TikTok', 'LinkedIn', 'Twitter', 'Referred by Friend/ Other', 'Other'
  )),

  -- Review workflow — never client-writable past its default (see REVOKE below).
  status text not null default 'Waiting for Verification',

  created_at timestamptz not null default now(),

  constraint gardener_expertise_max_5 check (array_length(area_of_expertise, 1) is null or array_length(area_of_expertise, 1) <= 5)
);

create index if not exists gardener_phone_idx on gardener (phone);
create index if not exists gardener_status_idx on gardener (status);

alter table gardener enable row level security;

-- Public join form can only ever create a row — never read, edit, or delete
-- any gardener's data (including their own) through the anon/publishable key.
create policy gardener_insert_public on gardener
  for insert
  to anon, authenticated
  with check (true);

-- Belt-and-suspenders: even though the INSERT policy has no column
-- restriction, explicitly block the client from ever setting `status` itself
-- on insert, so a new application can only ever land as the default.
revoke insert (status) on gardener from anon, authenticated;

-- ── Storage buckets for this form's file uploads ────────────────────────────
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('id-documents', 'id-documents', false)
on conflict (id) do nothing;

-- uploads: public bucket — anon can upload, anyone can read via getPublicUrl.
create policy gardener_uploads_insert on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'uploads');

create policy gardener_uploads_select on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'uploads');

-- id-documents: private bucket — anon can upload but never read back. Viewing
-- a citizenship/NID document must go through a future service-role Edge
-- Function that generates a short-lived signed URL for an authenticated
-- Admin/BDM/Call Center session, never the client's own anon key.
create policy gardener_id_documents_insert on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'id-documents');
