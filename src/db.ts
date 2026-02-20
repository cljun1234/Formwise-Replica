import Database from 'better-sqlite3';
import path from 'path';

// Initialize database
const dbPath = path.resolve('forms.db');
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    provider TEXT DEFAULT 'gemini',
    model TEXT DEFAULT 'gemini-2.5-flash-latest',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL,
    placeholder TEXT,
    required INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    FOREIGN KEY (form_id) REFERENCES forms (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'text', 'url'
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS form_resources (
    form_id INTEGER NOT NULL,
    resource_id INTEGER NOT NULL,
    PRIMARY KEY (form_id, resource_id),
    FOREIGN KEY (form_id) REFERENCES forms (id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
  );
`);

// Migration helper to add columns if they don't exist (for existing DBs)
try {
  db.prepare('ALTER TABLE forms ADD COLUMN provider TEXT DEFAULT "gemini"').run();
} catch (e) {
  // Column likely exists
}

try {
  db.prepare('ALTER TABLE forms ADD COLUMN model TEXT DEFAULT "gemini-2.5-flash-latest"').run();
} catch (e) {
  // Column likely exists
}

export default db;
