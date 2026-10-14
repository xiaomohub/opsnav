import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { config } from "./config";

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  totp_secret: string | null;
  totp_enabled: number;
  created_at: string;
};

export type NavEntryRow = {
  id: number;
  name: string;
  url: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type AssetRow = {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  auth_type: "password" | "private_key";
  secret_encrypted: string;
  created_at: string;
  updated_at: string;
};

let dbInstance: Database.Database | null = null;

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      totp_secret TEXT,
      totp_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS nav_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 22,
      username TEXT NOT NULL,
      auth_type TEXT NOT NULL CHECK (auth_type IN ('password', 'private_key')),
      secret_encrypted TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seedAdmin(database: Database.Database) {
  const row = database
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(config.adminUsername()) as { id: number } | undefined;
  if (row) return;

  const hash = bcrypt.hashSync(config.adminPassword(), 10);
  database
    .prepare(
      `INSERT INTO users (username, password_hash, totp_enabled) VALUES (?, ?, 0)`
    )
    .run(config.adminUsername(), hash);
  console.log(`[db] Seeded admin user: ${config.adminUsername()}`);
}

function seedNavIfEmpty(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) as c FROM nav_entries").get() as {
    c: number;
  };
  if (count.c > 0) return;

  const samples = [
    ["GitHub", "https://github.com", "代码托管"],
    ["OpsNav 文档", "https://github.com/xiaomohub/opsnav", "本仓库"],
  ];
  const stmt = database.prepare(
    `INSERT INTO nav_entries (name, url, description) VALUES (?, ?, ?)`
  );
  for (const [name, url, description] of samples) {
    stmt.run(name, url, description);
  }
  console.log("[db] Seeded sample nav entries");
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbPath = config.databasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  dbInstance = new Database(dbPath);
  dbInstance.pragma("journal_mode = WAL");
  migrate(dbInstance);
  seedAdmin(dbInstance);
  seedNavIfEmpty(dbInstance);
  return dbInstance;
}
