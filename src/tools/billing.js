const db = require("../db/database");
const { calculateGST } = require("../utils/gst");
const { rupeesToPaise, formatINR } = require("../utils/money");
const khata = require("./khata");
/*
    BILL STATUS:
    DRAFT
    FINALIZED
    CANCELLED
*/

// --------------------------------------------------
// CREATE DRAFT BILL
// --------------------------------------------------

function createBill() {
    const result = db.prepare(`
        INSERT INTO bills (status)
        VALUES ('DRAFT')
    `).run();

    const billId = result.lastInsertRowid;

    return {
        success: true,
        billId,
        message: `Draft bill ${billId} created`
    };
}


// --------------------------------------------------
// ADD ITEM TO DRAFT BILL
// --------------------------------------------------

function addBillItem(billId, productId, quantity) {

    if (quantity <= 0) {
        return {
            success: false,
            error: "Quantity must be greater than zero"
        };
    }

    const bill = db.prepare(`
        SELECT *
        FROM bills
        WHERE id = ?
    `).get(billId);

    if (!bill) {
        return {
            success: false,
            error: "Bill not found"
        };
    }

    if (bill.status !== "DRAFT") {
        return {
            success: false,
            error: "Only draft bills can be modified"
        };
    }

    const product = db.prepare(`
        SELECT *
        FROM products
        WHERE id = ?
    `).get(productId);

    if (!product) {
        return {
            success: false,
            error: "Product not found"
        };
    }

    /*
        IMPORTANT:
        We do NOT decrement stock here.

        Stock is only changed when the bill is finalized.
    */

    const existing = db.prepare(`
        SELECT *
        FROM bill_items
        WHERE bill_id = ?
        AND product_id = ?
    `).get(billId, productId);

    let finalQuantity = quantity;

    if (existing) {
        finalQuantity = existing.quantity + quantity;

        db.prepare(`
            UPDATE bill_items
            SET quantity = ?
            WHERE id = ?
        `).run(
            finalQuantity,
            existing.id
        );
    } else {

        const taxableAmount =
            Math.round(product.sell_price * quantity);

        const gst = calculateGST(
            taxableAmount,
            product.gst_rate
        );

        db.prepare(`
            INSERT INTO bill_items (
                bill_id,
                product_id,
                product_name,
                quantity,
                unit_price,
                cost_price,
                hsn_code,
                gst_rate,
                taxable_amount,
                cgst,
                sgst,
                total
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            billId,
            productId,
            product.name,
            quantity,
            product.sell_price,
            product.cost_price,
            product.hsn_code,
            product.gst_rate,
            taxableAmount,
            gst.cgst,
            gst.sgst,
            taxableAmount + gst.cgst + gst.sgst
        );
    }

    recalculateBill(billId);

    return getBill(billId);
}


// --------------------------------------------------
// REMOVE ITEM
// --------------------------------------------------

function removeBillItem(billId, productId) {

    const bill = db.prepare(`
        SELECT *
        FROM bills
        WHERE id = ?
    `).get(billId);

    if (!bill) {
        return {
            success: false,
            error: "Bill not found"
        };
    }

    if (bill.status !== "DRAFT") {
        return {
            success: false,
            error: "Only draft bills can be modified"
        };
    }

    const result = db.prepare(`
        DELETE FROM bill_items
        WHERE bill_id = ?
        AND product_id = ?
    `).run(
        billId,
        productId
    );

    if (result.changes === 0) {
        return {
            success: false,
            error: "Item is not present in this bill"
        };
    }

    recalculateBill(billId);

    return getBill(billId);
}


// --------------------------------------------------
// CHANGE ITEM QUANTITY
// --------------------------------------------------

function updateBillItem(
    billId,
    productId,
    quantity
) {

    if (quantity <= 0) {
        return removeBillItem(
            billId,
            productId
        );
    }

    const bill = db.prepare(`
        SELECT *
        FROM bills
        WHERE id = ?
    `).get(billId);

    if (!bill) {
        return {
            success: false,
            error: "Bill not found"
        };
    }

    if (bill.status !== "DRAFT") {
        return {
            success: false,
            error: "Only draft bills can be modified"
        };
    }

    const item = db.prepare(`
        SELECT *
        FROM bill_items
        WHERE bill_id = ?
        AND product_id = ?
    `).get(
        billId,
        productId
    );

    if (!item) {
        return {
            success: false,
            error: "Item is not present in this bill"
        };
    }

    db.prepare(`
        UPDATE bill_items
        SET quantity = ?
        WHERE id = ?
    `).run(
        quantity,
        item.id
    );

    recalculateBill(billId);

    return getBill(billId);
}


// --------------------------------------------------
// RECALCULATE BILL
// --------------------------------------------------

function recalculateBill(billId) {

    const items = db.prepare(`
        SELECT *
        FROM bill_items
        WHERE bill_id = ?
    `).all(billId);

    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;

    for (const item of items) {

        const taxableAmount =
            Math.round(
                item.unit_price * item.quantity
            );

        const gst = calculateGST(
            taxableAmount,
            item.gst_rate
        );

        const total =
            taxableAmount +
            gst.cgst +
            gst.sgst;

        db.prepare(`
            UPDATE bill_items
            SET
                taxable_amount = ?,
                cgst = ?,
                sgst = ?,
                total = ?
            WHERE id = ?
        `).run(
            taxableAmount,
            gst.cgst,
            gst.sgst,
            total,
            item.id
        );

        subtotal += taxableAmount;
        cgst += gst.cgst;
        sgst += gst.sgst;
    }

    const total =
        subtotal +
        cgst +
        sgst;

    db.prepare(`
        UPDATE bills
        SET
            subtotal = ?,
            cgst = ?,
            sgst = ?,
            total = ?
        WHERE id = ?
    `).run(
        subtotal,
        cgst,
        sgst,
        total,
        billId
    );
}


// --------------------------------------------------
// GET BILL
// --------------------------------------------------

function getBill(billId) {

    const bill = db.prepare(`
        SELECT *
        FROM bills
        WHERE id = ?
    `).get(billId);

    if (!bill) {
        return {
            success: false,
            error: "Bill not found"
        };
    }

    const items = db.prepare(`
        SELECT *
        FROM bill_items
        WHERE bill_id = ?
        ORDER BY id
    `).all(billId);

    return {
        success: true,
        bill,
        items
    };
}
// --------------------------------------------------
// GET LAST FINALIZED BILL
// --------------------------------------------------

function getLastFinalizedBill() {

    const bill = db.prepare(`
        SELECT *
        FROM bills
        WHERE status = 'FINALIZED'
        ORDER BY id DESC
        LIMIT 1
    `).get();

    if (!bill) {
        return {
            success: false,
            error: "No finalized bills found"
        };
    }

    const items = db.prepare(`
        SELECT *
        FROM bill_items
        WHERE bill_id = ?
        ORDER BY id
    `).all(bill.id);

    return {
        success: true,
        bill,
        items
    };
}
// --------------------------------------------------
// FINALIZE BILL
// --------------------------------------------------

function finalizeBill(
    billId,
    paymentMode,
    paymentReference = null,
    idempotencyKey = null,
    customerId = null
) {
    try {

        paymentMode = String(paymentMode || "").toUpperCase();

        if (
            paymentReference &&
            typeof paymentReference === "string"
        ) {
            paymentReference = paymentReference.trim();

            // Ignore accidental conversational text
            if (
                paymentReference.toLowerCase().includes("finalizing") ||
                paymentReference.toLowerCase().includes("finalize bill") ||
                paymentReference.toLowerCase().includes("making bill") ||
                paymentReference.toLowerCase().includes("complete bill")
            ) {
                paymentReference = null;
            }
        }

        const transaction = db.transaction(() => {

            // Get bill
            const bill = db.prepare(`
                SELECT *
                FROM bills
                WHERE id = ?
            `).get(billId);

            // ... existing validation ...

            // Get bill items
            const items = db.prepare(`
                SELECT *
                FROM bill_items
                WHERE bill_id = ?
            `).all(billId);

            // ... existing validation ...

            // ------------------------------------------
            // DEDUCT STOCK
            // ------------------------------------------

            for (const item of items) {

                const result = db.prepare(`
                    UPDATE products
                    SET quantity = quantity - ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    AND quantity >= ?
                `).run(
                    item.quantity,
                    item.product_id,
                    item.quantity
                );

                if (result.changes !== 1) {
                    throw new Error(
                        `Insufficient stock for ${item.product_name}`
                    );
                }
            }


            // ------------------------------------------
            // KHATA TRANSACTION
            // ------------------------------------------

            if (paymentMode === "KHATA") {

                if (!customerId) {
                    throw new Error(
                        "Customer is required for Khata payment"
                    );
                }

                const customer = db.prepare(`
                    SELECT *
                    FROM customers
                    WHERE id = ?
                `).get(customerId);

                if (!customer) {
                    throw new Error(
                        "Customer not found"
                    );
                }

                khata.addCredit(
                    customerId,
                    bill.total,
                    `Bill ${billId}`
                );
            }


            // ------------------------------------------
            // FINALIZE BILL
            // ------------------------------------------

            const invoiceNumber = `INV-${String(billId).padStart(6, "0")}`;

            db.prepare(`
                UPDATE bills
                SET status = 'FINALIZED',
                    invoice_number = ?,
                    payment_mode = ?,
                    payment_reference = ?,
                    idempotency_key = ?,
                    finalized_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                invoiceNumber,
                paymentMode,
                paymentReference,
                idempotencyKey,
                billId
            );

            return {
                success: true,
                alreadyFinalized: false,
                invoiceNumber
            };
        });

        return transaction();

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}


// --------------------------------------------------
// EXPORT
// --------------------------------------------------

module.exports = {
    createBill,
    addBillItem,
    removeBillItem,
    updateBillItem,
    getBill,
    getLastFinalizedBill,
    finalizeBill
};