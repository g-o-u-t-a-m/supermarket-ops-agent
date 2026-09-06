const db = require("../db/database");

function searchProducts(searchTerm) {
    const products = db.prepare(`
        SELECT
            id,
            sku,
            name,
            brand,
            unit,
            is_loose,
            quantity,
            cost_price,
            sell_price,
            mrp,
            reorder_level,
            hsn_code,
            gst_rate
        FROM products
        WHERE
            LOWER(name) LIKE LOWER(?)
            OR LOWER(brand) LIKE LOWER(?)
            OR LOWER(sku) LIKE LOWER(?)
        ORDER BY name
        LIMIT 10
    `).all(
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`
    );

    return {
        success: true,
        products
    };
}

function getStock(productId) {
    const product = db.prepare(`
        SELECT
            id,
            name,
            quantity,
            unit,
            reorder_level
        FROM products
        WHERE id = ?
    `).get(productId);

    if (!product) {
        return {
            success: false,
            error: "Product not found"
        };
    }

    return {
        success: true,
        product
    };
}

function getLowStock() {
    const products = db.prepare(`
        SELECT
            id,
            name,
            quantity,
            unit,
            reorder_level
        FROM products
        WHERE quantity <= reorder_level
        ORDER BY quantity ASC
    `).all();

    return {
        success: true,
        products
    };
}

function receiveStock(productId, quantity, costPrice, mrp) {
    if (quantity <= 0) {
        return {
            success: false,
            error: "Quantity must be greater than zero"
        };
    }

    if (costPrice < 0 || mrp < 0) {
        return {
            success: false,
            error: "Price cannot be negative"
        };
    }

    if (mrp < costPrice) {
        return {
            success: false,
            error: "MRP cannot be lower than cost price"
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

    const transaction = db.transaction(() => {
        db.prepare(`
            UPDATE products
            SET
                quantity = quantity + ?,
                cost_price = ?,
                mrp = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            quantity,
            Math.round(costPrice * 100),
            Math.round(mrp * 100),
            productId
        );
    });

    transaction();

    const updated = db.prepare(`
        SELECT id, name, quantity, unit, cost_price, mrp
        FROM products
        WHERE id = ?
    `).get(productId);

    return {
        success: true,
        message: `Received ${quantity} ${updated.unit} of ${updated.name}`,
        product: updated
    };
}

module.exports = {
    searchProducts,
    getStock,
    getLowStock,
    receiveStock
};