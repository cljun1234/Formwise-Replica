import mysql from 'mysql2/promise';

export interface Database {
  run(sql: string, ...params: any[]): Promise<{ lastID: number; changes: number }>;
  get(sql: string, ...params: any[]): Promise<any>;
  all(sql: string, ...params: any[]): Promise<any[]>;
  exec(sql: string): Promise<void>;
}

let dbPromise: Promise<Database> | null = null;

async function initDb(): Promise<Database> {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
  });

  // Initialize schema
  const connection = await pool.getConnection();
  try {
    // Forms
    await connection.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        prompt_template TEXT NOT NULL,
        provider VARCHAR(255) DEFAULT 'gemini',
        model VARCHAR(255) DEFAULT 'gemini-2.5-flash-latest',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Fields
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fields (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        label VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        placeholder TEXT,
        required TINYINT(1) DEFAULT 0,
        order_index INT DEFAULT 0,
        FOREIGN KEY (form_id) REFERENCES forms (id) ON DELETE CASCADE
      )
    `);

    // Resources
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        content LONGTEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Form Resources
    await connection.query(`
      CREATE TABLE IF NOT EXISTS form_resources (
        form_id INT NOT NULL,
        resource_id INT NOT NULL,
        PRIMARY KEY (form_id, resource_id),
        FOREIGN KEY (form_id) REFERENCES forms (id) ON DELETE CASCADE,
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
      )
    `);

    // Migrations
    try {
      await connection.query('ALTER TABLE forms ADD COLUMN provider VARCHAR(255) DEFAULT "gemini"');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
          throw e;
      }
    }

    try {
      await connection.query('ALTER TABLE forms ADD COLUMN model VARCHAR(255) DEFAULT "gemini-2.5-flash-latest"');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
           throw e;
      }
    }

  } catch (err) {
      console.error("Error initializing database schema:", err);
      throw err;
  } finally {
    connection.release();
  }

  return {
    async run(sql: string, ...params: any[]) {
      if (params.length === 1 && Array.isArray(params[0])) params = params[0];
      const [result] = await pool.execute<mysql.ResultSetHeader>(sql, params);
      return { lastID: result.insertId, changes: result.affectedRows };
    },
    async get(sql: string, ...params: any[]) {
      if (params.length === 1 && Array.isArray(params[0])) params = params[0];
      const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params);
      return rows[0];
    },
    async all(sql: string, ...params: any[]) {
      if (params.length === 1 && Array.isArray(params[0])) params = params[0];
      const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params);
      return rows;
    },
    async exec(sql: string) {
      await pool.query(sql);
    }
  };
}

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}
