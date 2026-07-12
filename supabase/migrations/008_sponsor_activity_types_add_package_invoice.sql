-- 008_sponsor_activity_types_add_package_invoice.sql
-- Adds two sponsorship-workflow activity types to the sponsor_activities
-- check constraint so the CRM dropdown can log them alongside calls, emails
-- and meetings.
--   package_sent — sponsorship package (contract, benefits, artwork) sent
--   invoice_sent — invoice raised and sent to the sponsor

alter table public.sponsor_activities
  drop constraint if exists sponsor_activities_activity_type_check;

alter table public.sponsor_activities
  add constraint sponsor_activities_activity_type_check
  check (activity_type in (
    'call', 'email', 'meeting', 'letter',
    'payment', 'renewal', 'note', 'other',
    'package_sent', 'invoice_sent'
  ));
