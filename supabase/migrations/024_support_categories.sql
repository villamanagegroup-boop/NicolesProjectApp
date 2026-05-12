-- 024_support_categories.sql
-- Adds a category to support_messages so the user-facing "Contact support"
-- panel can show a dropdown and Nicole's triage queue gets pre-classified
-- tickets ("Payment", "Account", "Bug") instead of a wall of free-text.
--
-- Existing rows backfill to 'other' so the queue keeps working.

alter table public.support_messages
  add column if not exists category text;

-- Constrain to the values the UI offers so a typo can't sneak past RLS.
alter table public.support_messages
  drop constraint if exists support_messages_category_check;

alter table public.support_messages
  add constraint support_messages_category_check
  check (category is null or category in (
    'bug',
    'login',
    'payment',
    'content',
    'account',
    'feature',
    'other'
  ));

update public.support_messages
   set category = 'other'
 where category is null;
