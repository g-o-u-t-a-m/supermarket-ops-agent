const {
    formatINR
} = require("./money");


function formatDailySummary(data) {

    const summary =
        data.summary;


    const lines = [];

    lines.push(
        `Date: ${data.date}`
    );

    lines.push(
        `Bills: ${summary.total_bills}`
    );

    lines.push(
        `Sales: ${formatINR(summary.total)}`
    );

    lines.push(
        `Taxable sales: ${formatINR(summary.subtotal)}`
    );

    lines.push(
        `CGST: ${formatINR(summary.cgst)}`
    );

    lines.push(
        `SGST: ${formatINR(summary.sgst)}`
    );


    lines.push("");

    lines.push("Payments:");

    for (const payment of data.payments) {

        lines.push(
            `${payment.payment_mode}: ` +
            `${formatINR(payment.amount)} ` +
            `(${payment.bill_count} bills)`
        );
    }


    return lines.join("\n");
}


function formatTopProducts(data) {

    const lines = [];

    lines.push(
        `Top products: ${data.startDate} → ${data.endDate}`
    );

    lines.push("");

    data.products.forEach(
        (product, index) => {

            lines.push(
                `${index + 1}. ` +
                `${product.product_name} - ` +
                `${product.quantity_sold} units - ` +
                `${formatINR(product.sales_amount)}`
            );

        }
    );


    return lines.join("\n");
}


module.exports = {
    formatDailySummary,
    formatTopProducts
};