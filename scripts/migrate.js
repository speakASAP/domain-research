#!/usr/bin/env node
const { Client } = require('pg');

const ddl = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS domain_suggestion_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  description text NOT NULL,
  locale varchar(16) NOT NULL DEFAULT 'en',
  tlds jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar(32) NOT NULL DEFAULT 'completed',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS domain_candidates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid REFERENCES domain_suggestion_jobs(id) ON DELETE CASCADE,
  fqdn varchar(255) NOT NULL,
  sld varchar(128) NOT NULL,
  tld varchar(32) NOT NULL,
  score double precision NOT NULL DEFAULT 0,
  source varchar(32) NOT NULL DEFAULT 'heuristic',
  availability varchar(32) NOT NULL DEFAULT 'unchecked',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS domain_checks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  fqdn varchar(255) NOT NULL,
  provider varchar(64) NOT NULL DEFAULT 'rdap',
  availability varchar(32) NOT NULL,
  confidence varchar(32) NOT NULL DEFAULT 'medium',
  registrar varchar(255),
  expires_at timestamptz,
  nameservers jsonb NOT NULL DEFAULT '[]'::jsonb,
  registry_statuses jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_hash varchar(128),
  error text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS domain_watches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  fqdn varchar(255) NOT NULL,
  user_id varchar(128),
  notification_email varchar(320),
  enabled boolean NOT NULL DEFAULT true,
  drop_tracking_consent varchar(32) NOT NULL DEFAULT 'pending',
  lifecycle_stage varchar(32) NOT NULL DEFAULT 'unknown',
  drop_candidate_at timestamptz,
  last_registry_statuses jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_check_at timestamptz,
  last_check_at timestamptz,
  last_availability varchar(32) NOT NULL DEFAULT 'unknown',
  last_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS domain_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  watch_id uuid NOT NULL,
  type varchar(64) NOT NULL,
  dedupe_key varchar(160),
  channel varchar(32) NOT NULL DEFAULT 'email',
  recipient_ref varchar(320),
  status varchar(32) NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);


ALTER TABLE domain_checks ADD COLUMN IF NOT EXISTS registry_statuses jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE domain_watches ADD COLUMN IF NOT EXISTS drop_tracking_consent varchar(32) NOT NULL DEFAULT 'pending';
ALTER TABLE domain_watches ADD COLUMN IF NOT EXISTS lifecycle_stage varchar(32) NOT NULL DEFAULT 'unknown';
ALTER TABLE domain_watches ADD COLUMN IF NOT EXISTS drop_candidate_at timestamptz;
ALTER TABLE domain_watches ADD COLUMN IF NOT EXISTS last_registry_statuses jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE domain_notifications ADD COLUMN IF NOT EXISTS dedupe_key varchar(160);
ALTER TABLE domain_notifications ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_domain_checks_fqdn ON domain_checks(fqdn);
CREATE INDEX IF NOT EXISTS idx_domain_watches_fqdn ON domain_watches(fqdn);
CREATE INDEX IF NOT EXISTS idx_domain_watches_user_id ON domain_watches(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_watches_next_check_at ON domain_watches(next_check_at);
CREATE INDEX IF NOT EXISTS idx_domain_notifications_watch_id ON domain_notifications(watch_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_notifications_dedupe ON domain_notifications(watch_id, type, dedupe_key) WHERE dedupe_key IS NOT NULL;
`;

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'db-server-postgres.statex-apps.svc.cluster.local',
    port: Number.parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'domain_research',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'domain_research',
  });
  await client.connect();
  await client.query(ddl);
  await client.end();
  console.log('domain-research migrations applied');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
