# Database Integration Guide

This application currently uses a **local SQLite database** (`forms.db`) to store forms, fields, and resources.

## 1. Accessing the Current Database

The database file is located at the root of the project: `forms.db`.

You can view and query this data using any SQLite client, such as:
*   [DB Browser for SQLite](https://sqlitebrowser.org/)
*   [DBeaver](https://dbeaver.io/)
*   Visual Studio Code extensions (e.g., "SQLite" by alexcvzz)

### Database Schema

The schema is defined in `src/db.ts`. Key tables include:

*   **`forms`**: Stores the main form metadata (title, prompt template, provider/model).
*   **`fields`**: Stores the input fields associated with each form (linked via `form_id`).
*   **`resources`**: Stores reference materials (text snippets, URLs).
*   **`form_resources`**: A join table linking forms to resources.

## 2. Integrating with an External Database (PostgreSQL, MySQL, etc.)

To switch from SQLite to another database (e.g., PostgreSQL, MySQL, or a cloud DB like Supabase/Neon), you need to modify the data access layer.

### Step 1: Install the New Driver
For PostgreSQL:
```bash
npm install pg
npm install --save-dev @types/pg
```

### Step 2: Update `src/db.ts`
Modify this file to connect to your new database instead of opening the SQLite file.

**Example (Conceptual PostgreSQL):**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getDb = () => pool;
```

### Step 3: Update `server.ts` Queries
The current implementation uses the `sqlite` driver's API (`db.all()`, `db.run()`, `db.get()`). Other drivers use different methods (e.g., `pg` uses `pool.query()`).

You will need to rewrite the SQL queries in `server.ts` to match your new database's dialect and driver API.

**Example Change:**

*Current (SQLite):*
```typescript
const forms = await db.all('SELECT * FROM forms ORDER BY created_at DESC');
```

*New (PostgreSQL with `pg`):*
```typescript
const result = await db.query('SELECT * FROM forms ORDER BY created_at DESC');
const forms = result.rows;
```

### Recommendation: Use an ORM or Query Builder
To make switching databases easier in the future, consider using an ORM like **Prisma** or **Drizzle ORM**. These tools abstract the underlying SQL driver, allowing you to switch databases by changing a configuration string.

## 3. API Integration
If you want to integrate *external* systems with this app's data, you should use the REST API provided by `server.ts`:

*   `GET /api/forms`: List all forms.
*   `GET /api/forms/:id`: Get a specific form and its fields.
*   `POST /api/forms/:id/execute`: Run a form with inputs to generate AI content.

You can call these endpoints from your other applications or scripts.
