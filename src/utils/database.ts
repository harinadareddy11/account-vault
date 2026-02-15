import * as SQLite from 'expo-sqlite';

let database: SQLite.SQLiteDatabase | null = null;
let initialized = false;

export const initDatabase = (): boolean => {
  try {
    if (initialized && database) return true;

    console.log('🚀 Initializing database...');
    database = SQLite.openDatabaseSync('vault.db');

    // 🔥 FIXED: userId is now preserved during migrations
    migrateTable('accounts', `
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL DEFAULT '',
      serviceName TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      accountId TEXT,
      password TEXT,
      apiKey TEXT,
      notes TEXT,
      priority TEXT DEFAULT 'normal',
      createdAt INTEGER NOT NULL DEFAULT ${Date.now()},
      updatedAt INTEGER NOT NULL DEFAULT ${Date.now()},
      lastUsed INTEGER
    `, 'id, userId, serviceName, email, category, accountId, password, apiKey, notes, priority, createdAt, updatedAt, lastUsed');

    migrateTable('projects', `
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL DEFAULT ${Date.now()},
      updatedAt INTEGER NOT NULL DEFAULT ${Date.now()}
    `, 'id, userId, name, createdAt, updatedAt');   // 🔥 FIXED

    migrateTable('project_services', `
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      userId TEXT NOT NULL DEFAULT '',
      serviceName TEXT NOT NULL,
      email TEXT,
      password TEXT,
      apiKey TEXT,
      expiryDate TEXT,
      notes TEXT,
      createdAt INTEGER NOT NULL DEFAULT ${Date.now()}
    `, 'id, projectId, userId, serviceName, email, password, apiKey, expiryDate, notes, createdAt'); // 🔥 FIXED

    createTables();

    initialized = true;
    console.log('✅✅✅ DATABASE READY');
    return true;
  } catch (error) {
    console.error('❌ DATABASE ERROR:', error);
    return false;
  }
};

const migrateTable = (tableName: string, schema: string, columnsToCopy: string) => {
  try {
    const db = database!;
    const tableCheck = db.getAllSync(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`
    );
    if (tableCheck.length === 0) return;

    const info = db.getAllSync(`PRAGMA table_info(${tableName})`);
    const hasUserId = info.some((col: any) => col.name === 'userId');

    if (!hasUserId) {
      console.log(`🔧 MIGRATING ${tableName} to include userId...`);

      db.execSync(`DROP TABLE IF EXISTS ${tableName}_temp;`);
      db.execSync(`CREATE TABLE ${tableName}_temp (${schema});`);

      // 🔥 FIXED: userId is copied too
      db.execSync(`
        INSERT INTO ${tableName}_temp (${columnsToCopy})
        SELECT ${columnsToCopy} FROM ${tableName};
      `);

      db.execSync(`DROP TABLE ${tableName};`);
      db.execSync(`ALTER TABLE ${tableName}_temp RENAME TO ${tableName};`);

      console.log(`✅ ${tableName} migrated successfully.`);
    }
  } catch (error) {
    console.error(`⚠️ Migration failed for ${tableName}:`, error);
  }
};

const createTables = () => {
  const db = database!;

  db.execSync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      serviceName TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      accountId TEXT,
      password TEXT,
      apiKey TEXT,
      notes TEXT,
      priority TEXT DEFAULT 'normal',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      lastUsed INTEGER
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_services (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      userId TEXT NOT NULL,
      serviceName TEXT NOT NULL,
      email TEXT,
      password TEXT,
      apiKey TEXT,
      expiryDate TEXT,
      notes TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      apiExpiryNotifications INTEGER DEFAULT 1,
      apiExpiryDaysBefore INTEGER DEFAULT 10,
      autoLockEnabled INTEGER DEFAULT 0,
      autoLockMinutes INTEGER DEFAULT 15,
      biometricEnabled INTEGER DEFAULT 0,
      theme TEXT DEFAULT 'dark',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId);
    CREATE INDEX IF NOT EXISTS idx_projects_userId ON projects(userId);
    CREATE INDEX IF NOT EXISTS idx_services_userId ON project_services(userId);
  `);
};

export const initUserDatabase = async (userId: string) => {
  const db = getDatabase();
  db.withTransactionSync(() => {
    // user-scoped defaults or cleanup if needed
  });
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!database) initDatabase();
  return database!;
};

export const isDatabaseReady = (): boolean => initialized && database !== null;
export default getDatabase;
