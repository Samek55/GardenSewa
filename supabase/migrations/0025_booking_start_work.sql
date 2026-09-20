-- HR spec Function 4: adds the "Start Work" milestone between Accept and the
-- existing Update/Finalize actions (editSchedule.js / complete-booking, both
-- untouched) — a professional must confirm work has begun (customer OTP)
-- before those become available. See start-booking-work/index.ts.
alter table booking add column if not exists work_started_at timestamptz;
alter table booking add column if not exists work_start_photos text[] not null default '{}';

-- Private storage paths (uploadPrivateDocument), not public URLs — same
-- posture as the gardener id-documents bucket, viewed only via a signed URL
-- through get-booking-document-url.
alter table booking add column if not exists work_documents text[] not null default '{}';
