const db = require("./database");

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE,
        name TEXT NOT NULL,
        brand TEXT,
        unit TEXT NOT NULL,
        is_loose INTEGER DEFAULT 0,

        cost_price INTEGER NOT NULL,
        sell_price INTEGER NOT NULL,
        mrp INTEGER NOT NULL,

        quantity REAL NOT NULL DEFAULT 0,
        reorder_level REAL NOT NULL DEFAULT 5,

        hsn_code TEXT NOT NULL,
        gst_rate INTEGER NOT NULL,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        phone TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        invoice_number TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'DRAFT',

        subtotal INTEGER DEFAULT 0,
        cgst INTEGER DEFAULT 0,
        sgst INTEGER DEFAULT 0,
        igst INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,

        payment_mode TEXT,
        payment_reference TEXT,

        idempotency_key TEXT UNIQUE,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        finalized_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        bill_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,

        product_name TEXT NOT NULL,
        quantity REAL NOT NULL,

        unit_price INTEGER NOT NULL,
        cost_price INTEGER NOT NULL,

        hsn_code TEXT NOT NULL,
        gst_rate INTEGER NOT NULL,

        taxable_amount INTEGER NOT NULL,
        cgst INTEGER NOT NULL,
        sgst INTEGER NOT NULL,
        total INTEGER NOT NULL,

        FOREIGN KEY (bill_id) REFERENCES bills(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        customer_id INTEGER NOT NULL,

        type TEXT NOT NULL,
        amount INTEGER NOT NULL,

        reference TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS owner_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        preference_key TEXT NOT NULL UNIQUE,
        preference_value TEXT NOT NULL,

        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log("Database schema ready.");