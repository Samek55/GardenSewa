-- otp_codes was keyed only by (phone, purpose), which is fine for
-- single-flight purposes (login, PIN reset, join application) but wrong for
-- 'work-completion' and 'schedule-update': a customer can have two
-- concurrently active bookings with two different gardeners, and issuing a
-- second OTP for the same phone+purpose (booking #2) deletes and replaces
-- the code a first gardener is still waiting on the customer to read out
-- (booking #1) — checkOtp has no booking to compare against, so gardener #1's
-- complete-booking call can succeed against a code the customer never
-- actually gave for that job. scope_key lets a caller narrow the OTP to one
-- booking; '' (the default) preserves the old phone+purpose-only behavior
-- for every other purpose, which never had — or needed — this problem.
alter table otp_codes add column if not exists scope_key text not null default '';

-- The old index only covered (phone, purpose); every lookup now also filters
-- on scope_key, so it needs to be part of the index too.
drop index if exists otp_codes_phone_purpose_idx;
create index if not exists otp_codes_phone_purpose_scope_idx on otp_codes (phone, purpose, scope_key);
