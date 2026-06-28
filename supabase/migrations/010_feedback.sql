create or replace function generate_feedback_reference()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code text := 'PLT-';
  i int;
begin
  for i in 1..4 loop
    code := code || substr(chars, floor(random() * 36)::int + 1, 1);
  end loop;
  return code;
end;
$$;

create table feedback (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        references auth.users not null,
  reference_code  text        unique not null default generate_feedback_reference(),
  type            text        not null check (type in ('bug', 'ux', 'other')),
  description     text        not null,
  page_url        text,
  user_agent      text,
  created_at      timestamptz default now()
);
