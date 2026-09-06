const {
    generateInvoicePDF
} = require("./tools/documents/invoicePdf");

const db =
    require("./db/database");


async function main() {

    const bill =
        db.prepare(`
            SELECT id
            FROM bills
            WHERE status = 'FINALIZED'
            ORDER BY id DESC
            LIMIT 1
        `).get();


    if (!bill) {

        console.log(
            "No finalized bill found."
        );

        return;
    }


    const result =
        await generateInvoicePDF(
            bill.id
        );


    console.log(result);
}


main();