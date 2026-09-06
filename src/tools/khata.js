const db = require("../db/database");

// --------------------------------------------------
// FIND CUSTOMER
// --------------------------------------------------

function findCustomer(name) {
    if (!name || !name.trim()) {
        return {
            success: false,
            error: "Customer name is required"
        };
    }

    const customers = db.prepare(`
        SELECT id, name, phone
        FROM customers
        WHERE LOWER(name) LIKE LOWER(?)
        ORDER BY name
        LIMIT 10
    `).all(`%${name.trim()}%`);

    return {
        success: true,
        customers
    };
}


// --------------------------------------------------
// CREATE CUSTOMER
// --------------------------------------------------

function createCustomer(name, phone = null) {

    if (!name || !name.trim()) {
        return {
            success: false,
            error: "Customer name is required"
        };
    }

    const existing = db.prepare(`
        SELECT *
        FROM customers
        WHERE LOWER(name) = LOWER(?)
    `).get(name.trim());

    if (existing) {
        return {
            success: false,
            error: "Customer already exists",
            customer: existing
        };
    }

    const result = db.prepare(`
        INSERT INTO customers (name, phone)
        VALUES (?, ?)
    `).run(
        name.trim(),
        phone
    );

    const customer = db.prepare(`
        SELECT id, name, phone
        FROM customers
        WHERE id = ?
    `).get(result.lastInsertRowid);

    return {
        success: true,
        customer
    };
}


// --------------------------------------------------
// GET BALANCE
// --------------------------------------------------

function getCustomerBalance(customerId) {

    const customer = db.prepare(`
        SELECT *
        FROM customers
        WHERE id = ?
    `).get(customerId);

    if (!customer) {
        return {
            success: false,
            error: "Customer does not exist"
        };
    }

    const result = db.prepare(`
        SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN type = 'CREDIT' THEN amount
                        WHEN type = 'PAYMENT' THEN -amount
                        ELSE 0
                    END
                ),
                0
            ) AS balance
        FROM credit_transactions
        WHERE customer_id = ?
    `).get(customerId);

    return {
        success: true,
        customer,
        balance: result.balance
    };
}


// --------------------------------------------------
// ADD CREDIT
// --------------------------------------------------

function addCredit(
    customerId,
    amount,
    reference = null
) {

    if (!Number.isInteger(amount) || amount <= 0) {
        return {
            success: false,
            error: "Credit amount must be positive paise"
        };
    }

    const customer = db.prepare(`
        SELECT *
        FROM customers
        WHERE id = ?
    `).get(customerId);

    if (!customer) {
        return {
            success: false,
            error: "Customer does not exist"
        };
    }

    db.prepare(`
        INSERT INTO credit_transactions (
            customer_id,
            type,
            amount,
            reference
        )
        VALUES (?, 'CREDIT', ?, ?)
    `).run(
        customerId,
        amount,
        reference
    );

    return getCustomerBalance(customerId);
}


// --------------------------------------------------
// RECORD PAYMENT
// --------------------------------------------------

function recordPayment(
    customerId,
    amount,
    reference = null
) {

    if (!Number.isInteger(amount) || amount <= 0) {
        return {
            success: false,
            error: "Payment amount must be positive paise"
        };
    }

    const customer = db.prepare(`
        SELECT *
        FROM customers
        WHERE id = ?
    `).get(customerId);

    if (!customer) {
        return {
            success: false,
            error: "Customer does not exist"
        };
    }

    const balance = getCustomerBalance(customerId);

    if (!balance.success) {
        return balance;
    }

    // ----------------------------------------------
    // GUARDRAIL:
    // Don't allow payment above outstanding balance.
    // ----------------------------------------------

    if (amount > balance.balance) {
        return {
            success: false,
            error:
                `Payment exceeds outstanding balance. ` +
                `Outstanding: ₹${(balance.balance / 100).toFixed(2)}`
        };
    }

    db.prepare(`
        INSERT INTO credit_transactions (
            customer_id,
            type,
            amount,
            reference
        )
        VALUES (?, 'PAYMENT', ?, ?)
    `).run(
        customerId,
        amount,
        reference
    );

    return getCustomerBalance(customerId);
}


// --------------------------------------------------
// TRANSACTION HISTORY
// --------------------------------------------------

function getCreditHistory(customerId) {

    const customer = db.prepare(`
        SELECT *
        FROM customers
        WHERE id = ?
    `).get(customerId);

    if (!customer) {
        return {
            success: false,
            error: "Customer does not exist"
        };
    }

    const transactions = db.prepare(`
        SELECT
            id,
            type,
            amount,
            reference,
            created_at
        FROM credit_transactions
        WHERE customer_id = ?
        ORDER BY id DESC
    `).all(customerId);

    return {
        success: true,
        customer,
        transactions
    };
}


module.exports = {
    findCustomer,
    createCustomer,
    getCustomerBalance,
    addCredit,
    recordPayment,
    getCreditHistory
};