-- Apply once to a dedicated D1 database. No personal emails or passwords in this file.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS cms_users (
 email TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', roles TEXT NOT NULL,
 scopes TEXT NOT NULL DEFAULT '[]', disabled INTEGER NOT NULL DEFAULT 0 CHECK(disabled IN (0,1)),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cms_guards (id TEXT PRIMARY KEY, ok INTEGER NOT NULL CHECK(ok=1));
CREATE TABLE IF NOT EXISTS cms_content (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('news','link','banner')),
 owner TEXT NOT NULL, draft TEXT NOT NULL, live TEXT, status TEXT NOT NULL DEFAULT 'draft',
 version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, published_at TEXT,
 FOREIGN KEY(owner) REFERENCES cms_users(email)
);
CREATE INDEX IF NOT EXISTS cms_content_kind ON cms_content(kind,status);
CREATE TABLE IF NOT EXISTS cms_content_history (
 id INTEGER PRIMARY KEY AUTOINCREMENT, content_id TEXT NOT NULL, version INTEGER NOT NULL,
 snapshot TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(content_id,version)
);
CREATE TABLE IF NOT EXISTS cms_media (
 id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, owner TEXT NOT NULL,
 alt TEXT NOT NULL, bytes INTEGER NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL,
 sha256 TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(owner) REFERENCES cms_users(email)
);
CREATE TABLE IF NOT EXISTS cms_proposals (
 id TEXT PRIMARY KEY, target TEXT NOT NULL, entity TEXT NOT NULL CHECK(entity IN ('clinical','support')),
 mode TEXT NOT NULL CHECK(mode IN ('update','confirm','add')), base_hash TEXT NOT NULL, base_json TEXT NOT NULL,
 patch TEXT NOT NULL, evidence TEXT NOT NULL, checked_at TEXT NOT NULL, uncertain TEXT NOT NULL DEFAULT '[]',
 note TEXT NOT NULL, author TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
 specialist TEXT, approver TEXT, reviewed_at TEXT, review_note TEXT NOT NULL DEFAULT '',
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 FOREIGN KEY(author) REFERENCES cms_users(email)
);
CREATE INDEX IF NOT EXISTS cms_proposals_status ON cms_proposals(status,updated_at);
CREATE TABLE IF NOT EXISTS cms_overrides (
 target TEXT PRIMARY KEY, entity TEXT NOT NULL, values_json TEXT NOT NULL, meta_json TEXT NOT NULL,
 base_values TEXT NOT NULL, addition INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1,
 published_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_data_history (
 id INTEGER PRIMARY KEY AUTOINCREMENT, target TEXT NOT NULL, proposal_id TEXT,
 before_json TEXT, after_json TEXT NOT NULL, actor TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL,
 before_json TEXT, after_json TEXT, created_at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS cms_audit_no_update BEFORE UPDATE ON cms_audit BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
CREATE TRIGGER IF NOT EXISTS cms_audit_no_delete BEFORE DELETE ON cms_audit BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
CREATE TRIGGER IF NOT EXISTS cms_history_no_update BEFORE UPDATE ON cms_data_history BEGIN SELECT RAISE(ABORT,'History is append-only'); END;
CREATE TRIGGER IF NOT EXISTS cms_history_no_delete BEFORE DELETE ON cms_data_history BEGIN SELECT RAISE(ABORT,'History is append-only'); END;
