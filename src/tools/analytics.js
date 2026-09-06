const db = require("../db/database");

// --------------------------------------------------
// DAILY SALES SUMMARY
// --------------------------------------------------

function getDailySales(date = null) {

    const dateCondition = date
        ? date
        : new Date().toISOString().split("T")[0];

    const summary = db.prepare(`
        SELECT
            COUNT(*) AS total_bills,
            COALESCE(SUM(subtotal), 0) AS subtotal,
            COALESCE(SUM(cgst), 0) AS cgst,
            COALESCE(SUM(sgst), 0) AS sgst,
            COALESCE(SUM(total), 0) AS total
        FROM bills
        WHERE status = 'FINALIZED'
        AND DATE(finalized_at) = ?
    `).get(dateCondition);

    const payments = db.prepare(`
        SELECT
            payment_mode,
            COUNT(*) AS bill_count,
            COALESCE(SUM(total), 0) AS amount
        FROM bills
        WHERE status = 'FINALIZED'
        AND DATE(finalized_at) = ?
        GROUP BY payment_mode
        ORDER BY amount DESC
    `).all(dateCondition);

    return {
        success: true,
        date: dateCondition,
        summary,
        payments
    };
}

// --------------------------------------------------
// TOP SELLING PRODUCTS
// --------------------------------------------------

function getTopProducts(
    startDate = null,
    endDate = null,
    limit = 10
) {

    const start =
        startDate ||
        new Date().toISOString().split("T")[0];

    const end =
        endDate ||
        start;


    const products = db.prepare(`
        SELECT
            bi.product_id,
            bi.product_name,

            SUM(bi.quantity) AS quantity_sold,

            SUM(bi.taxable_amount) AS sales_amount,

            COUNT(DISTINCT bi.bill_id) AS bill_count

        FROM bill_items bi

        JOIN bills b
            ON b.id = bi.bill_id

        WHERE b.status = 'FINALIZED'

        AND DATE(b.finalized_at)
            BETWEEN ? AND ?

        GROUP BY
            bi.product_id,
            bi.product_name

        ORDER BY quantity_sold DESC

        LIMIT ?
    `).all(
        start,
        end,
        limit
    );


    const formattedProducts = products.map(product => ({
        product_id: product.product_id,
        product_name: product.product_name,
        quantity_sold: product.quantity_sold,
        sales_amount: Number(product.sales_amount) || 0,
        bill_count: product.bill_count
    }));


    return {
        success: true,

        startDate: start,
        endDate: end,

        products: formattedProducts
    };
}


// --------------------------------------------------
// GST SUMMARY
// --------------------------------------------------

function getGSTSummary(
    startDate = null,
    endDate = null
) {

    const start =
        startDate ||
        new Date().toISOString().split("T")[0];

    const end =
        endDate ||
        start;


    const result = db.prepare(`
        SELECT

            COALESCE(SUM(subtotal), 0)
                AS taxable_amount,

            COALESCE(SUM(cgst), 0)
                AS cgst,

            COALESCE(SUM(sgst), 0)
                AS sgst,

            COALESCE(SUM(igst), 0)
                AS igst,

            COALESCE(SUM(cgst), 0)
            +
            COALESCE(SUM(sgst), 0)
            +
            COALESCE(SUM(igst), 0)
                AS total_tax

        FROM bills

        WHERE status = 'FINALIZED'

        AND DATE(finalized_at)
            BETWEEN ? AND ?

    `).get(
        start,
        end
    );


    const formattedGST = {
        taxable_amount: Number(result.taxable_amount) || 0,
        cgst: Number(result.cgst) || 0,
        sgst: Number(result.sgst) || 0,
        igst: Number(result.igst) || 0,
        total_tax: Number(result.total_tax) || 0
    };


    return {
        success: true,

        startDate: start,
        endDate: end,

        gst: formattedGST
    };
}


// --------------------------------------------------
// STOCK HEALTH
// --------------------------------------------------

function getStockHealth() {

    const total = db.prepare(`
        SELECT
            COUNT(*) AS total_products
        FROM products
    `).get();


    const lowStock = db.prepare(`
        SELECT
            id,
            name,
            quantity,
            reorder_level,
            unit
        FROM products

        WHERE quantity <= reorder_level

        ORDER BY quantity ASC
    `).all();


    const outOfStock = db.prepare(`
        SELECT
            id,
            name,
            quantity,
            unit
        FROM products

        WHERE quantity <= 0

        ORDER BY name
    `).all();


    return {
        success: true,

        totalProducts:
            total.total_products,

        lowStockCount:
            lowStock.length,

        outOfStockCount:
            outOfStock.length,

        lowStock,

        outOfStock
    };
}


// --------------------------------------------------
// SALES TREND
// --------------------------------------------------

function getSalesTrend(
    startDate,
    endDate
) {

    const result = db.prepare(`
        SELECT
            DATE(finalized_at) AS date,

            COUNT(*) AS bills,

            COALESCE(SUM(total), 0)
                AS sales,

            COALESCE(SUM(cgst), 0)
                AS cgst,

            COALESCE(SUM(sgst), 0)
                AS sgst

        FROM bills

        WHERE status = 'FINALIZED'

        AND DATE(finalized_at)
            BETWEEN ? AND ?

        GROUP BY DATE(finalized_at)

        ORDER BY date
    `).all(
        startDate,
        endDate
    );


    const formattedDays = result.map(day => ({

        date: day.date,

        bills:
            Number(day.bills) || 0,

        sales:
            Number(day.sales) || 0,

        cgst:
            Number(day.cgst) || 0,

        sgst:
            Number(day.sgst) || 0

    }));


    return {
        success: true,

        startDate,
        endDate,

        days: formattedDays
    };
}


// --------------------------------------------------
// WEEKLY SUMMARY
// --------------------------------------------------

function getWeeklySummary() {

    const today =
        new Date();

    const endDate =
        today.toISOString().split("T")[0];


    const start =
        new Date(today);

    start.setDate(
        start.getDate() - 6
    );


    const startDate =
        start.toISOString().split("T")[0];


    const sales =
        getSalesTrend(
            startDate,
            endDate
        );

    const topProducts =
        getTopProducts(
            startDate,
            endDate,
            10
        );

    const gst =
        getGSTSummary(
            startDate,
            endDate
        );

    const stock =
        getStockHealth();


    return {
        success: true,

        startDate,
        endDate,

        sales: sales.days,

        topProducts:
            topProducts.products,

        gst: gst.gst,

        stock: {
            totalProducts:
                stock.totalProducts,

            lowStockCount:
                stock.lowStockCount,

            outOfStockCount:
                stock.outOfStockCount
        }
    };
}


// --------------------------------------------------
// FULL DAILY CLOSE
// --------------------------------------------------

function closeDay(date = null) {

    const sales =
        getDailySales(date);

    const topProducts =
        getTopProducts(
            sales.date,
            sales.date,
            10
        );

    const gst =
        getGSTSummary(
            sales.date,
            sales.date
        );

    const stock =
        getStockHealth();


    return {
        success: true,

        date: sales.date,

        sales: sales.summary,

        payments: sales.payments,

        gst: gst.gst,

        topProducts:
            topProducts.products,

        stockHealth: {
            lowStockCount:
                stock.lowStockCount,

            outOfStockCount:
                stock.outOfStockCount
        }
    };
}


module.exports = {

    getDailySales,

    getTopProducts,

    getGSTSummary,

    getStockHealth,

    getSalesTrend,

    getWeeklySummary,

    closeDay

};