import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { SUBJECTS, SUBJECTS_BY_CAMPAIGN, TEMPLATES, DTC_TEMPLATES, DTC_DAY0_TEMPLATE_V1 } from "./lib.mjs";

export function openDb(filename = process.env.OUTREACH_DATABASE_PATH || "./data/outreach.sqlite") {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename); db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;"); migrate(db); return db;
}
export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (id INTEGER PRIMARY KEY, name TEXT NOT NULL, domain TEXT UNIQUE, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY, company_id INTEGER REFERENCES companies(id), first_name TEXT, last_name TEXT, email TEXT UNIQUE, linkedin_url TEXT, apollo_contact_id TEXT UNIQUE, title TEXT, technologies TEXT, industry TEXT, employees TEXT, email_status TEXT, catch_all_status TEXT, score INTEGER DEFAULT 0, status TEXT DEFAULT 'review', unsubscribed_at TEXT, bounced_at TEXT, paused_at TEXT, raw_data TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS campaigns (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'paused', daily_limit INTEGER DEFAULT 20, timezone TEXT DEFAULT 'America/Los_Angeles', allowed_weekdays TEXT DEFAULT '1,2,3,4,5', sending_start_hour INTEGER DEFAULT 9, sending_end_hour INTEGER DEFAULT 16, minimum_delay_minutes INTEGER DEFAULT 5, dry_run INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS subject_variants (id INTEGER PRIMARY KEY, campaign_id INTEGER NOT NULL REFERENCES campaigns(id), variant TEXT NOT NULL, subject TEXT NOT NULL, enabled INTEGER DEFAULT 0, UNIQUE(campaign_id, variant));
    CREATE TABLE IF NOT EXISTS enrollments (id INTEGER PRIMARY KEY, contact_id INTEGER NOT NULL REFERENCES contacts(id), campaign_id INTEGER NOT NULL REFERENCES campaigns(id), subject_variant_id INTEGER REFERENCES subject_variants(id), subject_line TEXT, website_variant TEXT NOT NULL, attribution_token TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'queued', enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP, original_sent_at TEXT, next_due_at TEXT, thread_id TEXT, reply_status TEXT, reply_classification TEXT, UNIQUE(contact_id, campaign_id));
    CREATE TABLE IF NOT EXISTS sequence_steps (id INTEGER PRIMARY KEY, enrollment_id INTEGER NOT NULL REFERENCES enrollments(id), step_number INTEGER NOT NULL, due_at TEXT NOT NULL, status TEXT DEFAULT 'pending', claimed_at TEXT, sent_at TEXT, provider_message_id TEXT, error TEXT, UNIQUE(enrollment_id, step_number));
    CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, enrollment_id INTEGER NOT NULL REFERENCES enrollments(id), sequence_step_id INTEGER REFERENCES sequence_steps(id), direction TEXT NOT NULL, provider_message_id TEXT, thread_id TEXT, subject TEXT, body_text TEXT, status TEXT, sent_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS replies (id INTEGER PRIMARY KEY, enrollment_id INTEGER NOT NULL REFERENCES enrollments(id), sender_email TEXT, received_at TEXT, classification TEXT DEFAULT 'review', body TEXT, automated INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS suppressions (id INTEGER PRIMARY KEY, email TEXT UNIQUE, reason TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS imports (id INTEGER PRIMARY KEY, filename TEXT, rows_total INTEGER, rows_created INTEGER, rows_updated INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS website_events (id INTEGER PRIMARY KEY, token TEXT, event_type TEXT, occurred_at TEXT DEFAULT CURRENT_TIMESTAMP, metadata TEXT);
    CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY, token TEXT, booked_at TEXT, payload TEXT);
    CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY, event TEXT NOT NULL, entity_type TEXT, entity_id TEXT, metadata TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  `);
  for (const [name, kind] of [["DTC Brands", "dtc"], ["Shopify / CRO Agencies", "agency"]]) db.prepare("INSERT OR IGNORE INTO campaigns(name,kind) VALUES (?,?)").run(name, kind);
  if (!db.prepare("PRAGMA table_info(enrollments)").all().some((column) => column.name === "subject_line")) db.exec("ALTER TABLE enrollments ADD COLUMN subject_line TEXT");
  for (const campaign of db.prepare("SELECT id,kind FROM campaigns").all()) {
    for (const [variant, subject] of (SUBJECTS_BY_CAMPAIGN[campaign.kind] || SUBJECTS)) db.prepare("INSERT OR IGNORE INTO subject_variants(campaign_id,variant,subject,enabled) VALUES (?,?,?,?)").run(campaign.id, variant, subject, variant === "A" || variant === "B" ? 1 : 0);
  }
  // Snapshot prior assignments before editing future-enrollment variants.
  db.exec("UPDATE enrollments SET subject_line=(SELECT subject FROM subject_variants WHERE id=enrollments.subject_variant_id) WHERE subject_line IS NULL");
  for (const campaign of db.prepare("SELECT id,kind FROM campaigns").all()) for (const [variant, subject] of (SUBJECTS_BY_CAMPAIGN[campaign.kind] || SUBJECTS)) {
    const oldSubject = SUBJECTS.find(([oldVariant]) => oldVariant === variant)?.[1];
    db.prepare("UPDATE subject_variants SET subject=? WHERE campaign_id=? AND variant=? AND subject=?").run(subject, campaign.id, variant, oldSubject || subject);
  }
  db.prepare("UPDATE subject_variants SET subject=? WHERE campaign_id IN (SELECT id FROM campaigns WHERE kind='dtc') AND variant='A' AND subject='A little extra Shopify firepower for ?'").run(SUBJECTS_BY_CAMPAIGN.dtc[0][1]);
  db.exec(`CREATE TABLE IF NOT EXISTS templates (campaign_id INTEGER NOT NULL REFERENCES campaigns(id), step_number INTEGER NOT NULL, body TEXT NOT NULL, PRIMARY KEY(campaign_id,step_number));`);
  for (const campaign of db.prepare("SELECT id,kind FROM campaigns").all()) (campaign.kind === "dtc" ? DTC_TEMPLATES : TEMPLATES).forEach((body, step) => db.prepare("INSERT OR IGNORE INTO templates(campaign_id,step_number,body) VALUES (?,?,?)").run(campaign.id, step, body));
  // Upgrade only the previously seeded DTC Day 0 copy; never overwrite an admin edit.
  db.prepare("UPDATE templates SET body=? WHERE campaign_id IN (SELECT id FROM campaigns WHERE kind='dtc') AND step_number=0 AND body IN (?, ?)").run(DTC_TEMPLATES[0], TEMPLATES[0], DTC_DAY0_TEMPLATE_V1);
}
