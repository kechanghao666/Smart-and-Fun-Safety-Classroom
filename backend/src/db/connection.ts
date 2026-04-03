import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import { backendRoot, env } from "../config/env";

let databasePromise: Promise<Database> | null = null;

export async function getDb() {
  if (!databasePromise) {
    const resolvedPath = path.isAbsolute(env.dbPath)
      ? env.dbPath
      : path.resolve(backendRoot, env.dbPath);

    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

    databasePromise = open({
      filename: resolvedPath,
      driver: sqlite3.Database,
    }).then(async (db) => {
      await db.exec("PRAGMA foreign_keys = ON;");
      return db;
    });
  }

  return databasePromise;
}
