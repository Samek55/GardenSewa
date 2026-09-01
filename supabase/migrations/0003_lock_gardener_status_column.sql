-- 0002's `revoke insert (status) ...` was a no-op: Postgres treats table-level
-- and column-level privileges independently, and a privilege check succeeds
-- if EITHER grants it — so the table-wide `grant insert on gardener` from
-- 0002 still let anon set `status` directly (confirmed: a test insert with
-- "status":"Approved" landed as Approved, not the default). The only way to
-- actually restrict one column is to drop the table-wide grant and grant
-- INSERT on the explicit column list instead.
revoke insert on gardener from anon, authenticated;

grant insert (
  full_name, phone, alternative_phone, foreign_returnee, citizenship_number,
  issued_district, email, nid_number, gender, blood_group,
  emergency_contact_number, emergency_contact_relation, citizenship_nid_path,
  profile_picture_url, academic_background, has_training_certificate,
  training_institute_name, training_certificate_url, experience_certificate_url,
  years_experience, area_of_expertise, work_preference, languages_known,
  personal_office_vehicle, has_driving_license, expected_working_city,
  working_area, province, district, municipality, ward,
  insurance_company_name, insurance_policy_number, referred_by_name,
  referral_phone_number, wants_advance_training, how_did_you_know
) on gardener to anon, authenticated;
