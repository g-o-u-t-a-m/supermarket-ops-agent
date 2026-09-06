const inventory =
    require("../tools/inventory");

const billing =
    require("../tools/billing");

const khata =
    require("../tools/khata");

const analytics =
    require("../tools/analytics");

const preferences =
    require("../tools/preferences");

const {
    generateInvoicePDF
} = require("../tools/documents/invoicePdf");

const {
    generateSalesDeck
} = require("../tools/documents/salesDeck");

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function rupeesToPaise(amount) {

    const value =
        Number(amount);

    if (!Number.isFinite(value) || value < 0) {
        throw new Error(
            "Invalid rupee amount"
        );
    }

    return Math.round(
        value * 100
    );
}


// --------------------------------------------------
// INVENTORY TOOLS
// --------------------------------------------------

async function searchProducts({
    query
}) {

    return inventory.searchProducts(
        query
    );
}


async function getProduct({
    productId
}) {

    return inventory.getProduct(
        productId
    );
}


async function getStock({
    productId
}) {

    return inventory.getStock(
        productId
    );
}


async function getLowStock() {

    return inventory.getLowStock();
}


async function receiveStock({
    productId,
    quantity,
    costPrice,
    mrp
}) {

    return inventory.receiveStock(
        productId,
        quantity,
        costPrice,
        mrp
    );
}


// --------------------------------------------------
// BILLING TOOLS
// --------------------------------------------------

async function createBill() {

    return billing.createBill();
}


async function addBillItem({
    billId,
    productId,
    quantity
}) {

    return billing.addBillItem(
        billId,
        productId,
        quantity
    );
}


async function updateBillItem({
    billId,
    productId,
    quantity
}) {

    return billing.updateBillItem(
        billId,
        productId,
        quantity
    );
}


async function removeBillItem({
    billId,
    productId
}) {

    return billing.removeBillItem(
        billId,
        productId
    );
}


async function getBill({
    billId
}) {

    return billing.getBill(
        billId
    );
}

async function getLastFinalizedBill() {
    return billing.getLastFinalizedBill();
}

async function finalizeBill({
    billId,
    paymentMode,
    paymentReference,
    customerId
}) {

    return billing.finalizeBill(
        billId,
        paymentMode,
        paymentReference || null,
        `agent-finalize-${billId}`,
        customerId || null
    );
}


// --------------------------------------------------
// KHATA TOOLS
// --------------------------------------------------

async function findCustomer({
    name
}) {

    return khata.findCustomer(
        name
    );
}


async function createCustomer({
    name,
    phone
}) {

    return khata.createCustomer(
        name,
        phone || null
    );
}


async function getCustomerBalance({
    customerId
}) {

    return khata.getCustomerBalance(
        customerId
    );
}


async function addCredit({
    customerId,
    amountRupees,
    reference
}) {

    return khata.addCredit(
        customerId,
        rupeesToPaise(amountRupees),
        reference || null
    );
}


async function recordKhataPayment({
    customerId,
    amountRupees,
    reference
}) {

    return khata.recordPayment(
        customerId,
        rupeesToPaise(amountRupees),
        reference || null
    );
}


async function getCreditHistory({
    customerId
}) {

    return khata.getCreditHistory(
        customerId
    );
}


// --------------------------------------------------
// ANALYTICS
// --------------------------------------------------

async function getDailySales({
    date
}) {

    return analytics.getDailySales(
        date || null
    );
}


async function closeDay({
    date
}) {

    return analytics.closeDay(
        date || null
    );
}


async function getTopProducts({
    startDate,
    endDate,
    limit
}) {

    return analytics.getTopProducts(
        startDate || null,
        endDate || null,
        limit || 10
    );
}


async function getWeeklySummary() {

    return analytics.getWeeklySummary();
}


async function getStockHealth() {

    return analytics.getStockHealth();
}


// --------------------------------------------------
// PREFERENCES
// --------------------------------------------------

async function setPreference({
    key,
    value
}) {

    return preferences.setPreference(
        key,
        value
    );
}


async function getPreference({
    key
}) {

    return preferences.getPreference(
        key
    );
}


async function getAllPreferences() {

    return preferences.getAllPreferences();
}


// --------------------------------------------------
// DOCUMENTS
// --------------------------------------------------

async function generateInvoice({
    billId
}) {

    return generateInvoicePDF(
        billId
    );
}


async function generateAnalysisDeck() {

    return generateSalesDeck();
}


// --------------------------------------------------
// EXPORT
// --------------------------------------------------

module.exports = {

    searchProducts,
    getProduct,
    getStock,
    getLowStock,
    receiveStock,

    createBill,
    addBillItem,
    updateBillItem,
    removeBillItem,
    getBill,
    getLastFinalizedBill,
    finalizeBill,

    findCustomer,
    createCustomer,
    getCustomerBalance,
    addCredit,
    recordKhataPayment,
    getCreditHistory,

    getDailySales,
    closeDay,
    getTopProducts,
    getWeeklySummary,
    getStockHealth,

    setPreference,
    getPreference,
    getAllPreferences,

    generateInvoice,
    generateAnalysisDeck
};