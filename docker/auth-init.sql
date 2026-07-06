-- Minimal auth schema bootstrap for local GoTrue (Phase 2 dev stack).
-- GoTrue runs its own migrations on startup; this grants the app DB user what it needs.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO vvs;
GRANT CREATE ON SCHEMA auth TO vvs;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO vvs;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO vvs;
