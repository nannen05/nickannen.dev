-- Enforce each campaign's daily_limit. The scheduler also passes a global
-- limit, which keeps the combined daily volume within the Resend Free limit.
alter table campaigns alter column daily_limit set default 10;

update campaigns
set daily_limit = 10
where kind = 'dtc';

create or replace function public.claim_due_steps(limit_count integer default 100)
returns table(step_id bigint,enrollment_id bigint,contact_id bigint,step_number integer,email text,first_name text,company_name text,campaign_status text,dry_run boolean,subject text,body text,website_variant text,attribution_token uuid,thread_id text)
language sql
security definer
set search_path=public
as $$
  with sent_today as (
    select
      e.campaign_id,
      count(*)::integer as sent_count
    from messages m
    join enrollments e on e.id = m.enrollment_id
    join campaigns ca on ca.id = e.campaign_id
    where m.direction = 'outbound'
      and (m.sent_at at time zone ca.timezone)::date = (now() at time zone ca.timezone)::date
    group by e.campaign_id
  ),
  ranked_due_steps as (
    select
      ss.id as sequence_step_id,
      ss.due_at,
      ca.id as campaign_id,
      ca.daily_limit,
      coalesce(st.sent_count, 0) as sent_count,
      row_number() over (partition by ca.id order by ss.due_at, ss.id) as daily_position
    from sequence_steps ss
    join enrollments e on e.id = ss.enrollment_id
    join contacts c on c.id = e.contact_id
    join campaigns ca on ca.id = e.campaign_id
    left join sent_today st on st.campaign_id = ca.id
    where ss.status = 'pending'
      and ss.due_at <= now()
      and ca.status = 'active'
      and e.reply_status is null
      and c.unsubscribed_at is null
      and c.bounced_at is null
      and c.paused_at is null
      and not exists (select 1 from suppressions s where s.email = c.email)
  ),
  candidates as (
    select ss.id
    from sequence_steps ss
    join ranked_due_steps r on r.sequence_step_id = ss.id
    where r.daily_position <= greatest(r.daily_limit - r.sent_count, 0)
    order by r.due_at, ss.id
    for update of ss skip locked
    limit limit_count
  ),
  claimed as (
    update sequence_steps
    set status = 'sending', claimed_at = now()
    where id in (select id from candidates)
    returning *
  )
  select ss.id,e.id,c.id,ss.step_number,c.email,c.first_name,co.name,ca.status,ca.dry_run,e.subject_line,t.body,e.website_variant,e.attribution_token,e.thread_id
  from claimed ss
  join enrollments e on e.id = ss.enrollment_id
  join contacts c on c.id = e.contact_id
  left join companies co on co.id = c.company_id
  join campaigns ca on ca.id = e.campaign_id
  join templates t on t.campaign_id = ca.id and t.step_number = ss.step_number;
$$;
