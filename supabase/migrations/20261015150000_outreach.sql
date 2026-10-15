create extension if not exists pgcrypto;

create table if not exists companies (id bigint generated always as identity primary key, name text not null, domain text unique, created_at timestamptz not null default now());
create table if not exists contacts (id bigint generated always as identity primary key, company_id bigint references companies(id), first_name text, last_name text, email text not null unique, linkedin_url text unique, apollo_contact_id text unique, title text, technologies text, industry text, employees text, email_status text, catch_all_status text, score integer not null default 0, status text not null default 'review', unsubscribed_at timestamptz, bounced_at timestamptz, paused_at timestamptz, raw_data jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists campaigns (id bigint generated always as identity primary key, name text not null unique, kind text not null check (kind in ('dtc','agency')), status text not null default 'paused' check (status in ('paused','active')), daily_limit integer not null default 20, timezone text not null default 'America/Los_Angeles', allowed_weekdays text not null default '1,2,3,4,5', sending_start_hour integer not null default 9, sending_end_hour integer not null default 16, minimum_delay_minutes integer not null default 5, dry_run boolean not null default true, created_at timestamptz not null default now());
create table if not exists subject_variants (id bigint generated always as identity primary key, campaign_id bigint not null references campaigns(id) on delete cascade, variant text not null, subject text not null, enabled boolean not null default false, unique(campaign_id,variant));
create table if not exists templates (campaign_id bigint not null references campaigns(id) on delete cascade, step_number integer not null check(step_number between 0 and 3), body text not null, primary key(campaign_id,step_number));
create table if not exists enrollments (id bigint generated always as identity primary key, contact_id bigint not null references contacts(id), campaign_id bigint not null references campaigns(id), subject_variant_id bigint references subject_variants(id), subject_line text not null, website_variant text not null check(website_variant in ('A','B','C')), attribution_token uuid not null unique default gen_random_uuid(), status text not null default 'queued', enrolled_at timestamptz not null default now(), original_sent_at timestamptz, next_due_at timestamptz, thread_id text, reply_status text, reply_classification text, unique(contact_id,campaign_id));
create table if not exists sequence_steps (id bigint generated always as identity primary key, enrollment_id bigint not null references enrollments(id) on delete cascade, step_number integer not null check(step_number between 0 and 3), due_at timestamptz not null, status text not null default 'pending' check(status in ('pending','sending','sent','skipped')), claimed_at timestamptz, sent_at timestamptz, provider_message_id text, error text, unique(enrollment_id,step_number));
create table if not exists messages (id bigint generated always as identity primary key, enrollment_id bigint not null references enrollments(id), sequence_step_id bigint references sequence_steps(id), direction text not null check(direction in ('outbound','inbound')), provider_message_id text, thread_id text, subject text, body_text text, status text, sent_at timestamptz not null default now());
create table if not exists replies (id bigint generated always as identity primary key, enrollment_id bigint not null references enrollments(id), sender_email text, received_at timestamptz not null default now(), classification text not null default 'review', body text, automated boolean not null default false);
create table if not exists suppressions (id bigint generated always as identity primary key, email text not null unique, reason text not null, created_at timestamptz not null default now());
create table if not exists imports (id bigint generated always as identity primary key, filename text, rows_total integer not null, rows_created integer not null, rows_updated integer not null, created_at timestamptz not null default now());
create table if not exists website_events (id bigint generated always as identity primary key, token uuid, event_type text, occurred_at timestamptz not null default now(), metadata jsonb);
create table if not exists bookings (id bigint generated always as identity primary key, token uuid, booked_at timestamptz, payload jsonb);
create table if not exists audit_logs (id bigint generated always as identity primary key, event text not null, entity_type text, entity_id text, metadata jsonb, created_at timestamptz not null default now());

insert into campaigns(name,kind) values ('DTC Brands','dtc'),('Shopify / CRO Agencies','agency') on conflict(name) do nothing;
insert into subject_variants(campaign_id,variant,subject,enabled)
select c.id,v.variant,v.subject,v.enabled from campaigns c cross join lateral (values
 ('A',case when c.kind='dtc' then 'A little extra Shopify firepower for {{company}}?' else 'Extra Shopify dev support for ?' end,true),
 ('B',case when c.kind='dtc' then 'Helping move faster on Shopify' else 'Need another developer without another hire?' end,true),
 ('C','Extra Shopify dev capacity?',false),('D','Who handles Shopify development at {{company}}?',false)
) as v(variant,subject,enabled) on conflict(campaign_id,variant) do nothing;

insert into templates(campaign_id,step_number,body)
select c.id,t.step_number,t.body from campaigns c cross join lateral (values
 (0,case when c.kind='dtc' then $$Hey {{first_name}},

I'm Nick, a Shopify developer helping ecommerce brands build better shopping experiences and turn new ideas into live, conversion-focused features.

I work on everything from custom PDPs, landing pages, and storefront functionality to A/B testing, subscription experiences, and ongoing site improvements.

Whether {{company}} has a growing development backlog, wants to test new ideas, or just needs another experienced developer to help move projects forward, I'd love to see where I could help.

You can check out some of my work at {{website_link}}.

If you're open to chatting, here's my calendar: {{calendar_link}}.

Cheers,
Nick$$ else $$Hi {{first_name}},

I'm a Shopify developer working with ecommerce brands on custom storefront experiences, PDP improvements, and conversion-focused development.

Wanted to reach out and see if {{company}} ever works with outside developers for ongoing improvements or new projects.

You can see some of my work at {{website_link}}.

If it makes sense to connect, here's my calendar:
{{calendar_link}}

Thanks,
Nick$$ end),
 (1,$$Hey {{first_name}},

Just following up on my last email.

I help ecommerce teams with Shopify development, whether that's improving product pages, building custom sections, or testing new experiences to improve conversions.

If {{company}} could use an extra developer on upcoming projects, I'd be happy to chat.

Here's my work again: {{website_link}}

And my calendar if you'd like to connect:
{{calendar_link}}

Thanks,
Nick$$),
 (2,$$Hey {{first_name}},

One more quick follow-up.

A lot of my work involves improving the shopping experience through better PDPs, custom functionality, landing pages, and A/B testing.

If there's anything on {{company}}'s Shopify roadmap that could use additional development support, I'd be glad to help.

Some examples of my work: {{website_link}}

Happy to connect whenever convenient:
{{calendar_link}}

Best,
Nick$$),
 (3,$$Hey {{first_name}},

Wanted to check in one last time in case the timing wasn't right earlier.

If {{company}} ever needs an extra hand with Shopify development, CRO experiments, or new storefront features, I'd love to be considered.

You can find my work at {{website_link}} or grab a time here: {{calendar_link}}.

Either way, appreciate your time!

Best,
Nick$$)
) as t(step_number,body) on conflict(campaign_id,step_number) do nothing;

alter table companies enable row level security; alter table contacts enable row level security; alter table campaigns enable row level security; alter table subject_variants enable row level security; alter table templates enable row level security; alter table enrollments enable row level security; alter table sequence_steps enable row level security; alter table messages enable row level security; alter table replies enable row level security; alter table suppressions enable row level security; alter table imports enable row level security; alter table website_events enable row level security; alter table bookings enable row level security; alter table audit_logs enable row level security;

create or replace function public.claim_due_steps(limit_count integer default 25)
returns table(step_id bigint,enrollment_id bigint,contact_id bigint,step_number integer,email text,first_name text,company_name text,campaign_status text,dry_run boolean,subject text,body text,website_variant text,attribution_token uuid,thread_id text) language sql security definer set search_path=public as $$
 with candidates as (
   select ss.id from sequence_steps ss join enrollments e on e.id=ss.enrollment_id join contacts c on c.id=e.contact_id join campaigns ca on ca.id=e.campaign_id
   where ss.status='pending' and ss.due_at<=now() and ca.status='active' and e.reply_status is null and c.unsubscribed_at is null and c.bounced_at is null and c.paused_at is null and not exists(select 1 from suppressions s where s.email=c.email) order by ss.due_at for update of ss skip locked limit limit_count
 ), claimed as (update sequence_steps set status='sending',claimed_at=now() where id in (select id from candidates) returning *)
 select ss.id,e.id,c.id,ss.step_number,c.email,c.first_name,co.name,ca.status,ca.dry_run,e.subject_line,t.body,e.website_variant,e.attribution_token,e.thread_id
 from claimed ss join enrollments e on e.id=ss.enrollment_id join contacts c on c.id=e.contact_id left join companies co on co.id=c.company_id join campaigns ca on ca.id=e.campaign_id join templates t on t.campaign_id=ca.id and t.step_number=ss.step_number
;
$$;
