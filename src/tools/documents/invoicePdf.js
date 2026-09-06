const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const db = require("../../db/database");

const {
    formatINR
} = require("../../utils/money");

const FONT_PATH = path.join(
    process.cwd(),
    "fonts",
    "DejaVuSans.ttf"
);
// --------------------------------------------------
// GENERATE GST INVOICE PDF
// --------------------------------------------------

function generateInvoicePDF(billId) {

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


    if (bill.status !== "FINALIZED") {
        return {
            success: false,
            error:
                "Invoice can only be generated for a finalized bill"
        };
    }


    const items = db.prepare(`
        SELECT *
        FROM bill_items
        WHERE bill_id = ?
        ORDER BY id
    `).all(billId);


    if (items.length === 0) {
        return {
            success: false,
            error: "Bill has no items"
        };
    }


    // ----------------------------------------------
    // OUTPUT DIRECTORY
    // ----------------------------------------------

    const outputDir =
        path.join(
            process.cwd(),
            "generated"
        );

    fs.mkdirSync(
        outputDir,
        {
            recursive: true
        }
    );


    const filename =
        `invoice-${bill.invoice_number}.pdf`;

    const filePath =
        path.join(
            outputDir,
            filename
        );


    // ----------------------------------------------
    // PDF
    // ----------------------------------------------

    const doc =
        new PDFDocument({
            size: "A4",
            margin: 40
        });


    const stream =
        fs.createWriteStream(
            filePath
        );


    doc.pipe(stream);


    // ----------------------------------------------
    // HEADER
    // ----------------------------------------------

    doc
        .fontSize(22)
        .font(FONT_PATH)
        .text(
            "KIRANA STORE",
            {
                align: "center"
            }
        );


    doc
        .moveDown(0.3)
        .fontSize(10)
        .font(FONT_PATH)
        .text(
            "GST Invoice",
            {
                align: "center"
            }
        );


    doc.moveDown();


    // ----------------------------------------------
    // INVOICE INFO
    // ----------------------------------------------

    doc
        .fontSize(10)
        .font(FONT_PATH)
        .text(
            `Invoice No: ${bill.invoice_number}`
        );

    doc
        .font(FONT_PATH)
        .text(
            `Date: ${bill.finalized_at}`
        );

    doc.text(
        `Payment: ${bill.payment_mode}`
    );


    if (bill.payment_reference) {
        doc.text(
            `Reference: ${bill.payment_reference}`
        );
    }


    doc.moveDown();


    // ----------------------------------------------
    // TABLE HEADER
    // ----------------------------------------------

    const tableTop =
        doc.y;

    const columns = {
        item: 40,
        qty: 270,
        price: 320,
        taxable: 390,
        gst: 460,
        total: 515
    };


    doc
        .font(FONT_PATH)
        .fontSize(9)
        .text("Item", columns.item, tableTop)
        .text("Qty", columns.qty, tableTop)
        .text("Price", columns.price, tableTop)
        .text("Taxable", columns.taxable, tableTop)
        .text("GST", columns.gst, tableTop)
        .text("Total", columns.total, tableTop);


    doc
        .moveTo(40, tableTop + 15)
        .lineTo(555, tableTop + 15)
        .stroke();


    let y =
        tableTop + 25;


    // ----------------------------------------------
    // ITEMS
    // ----------------------------------------------

    for (const item of items) {

        const gstRate =
            Number(item.gst_rate);


        doc
            .font(FONT_PATH)
            .fontSize(8)
            .text(
                item.product_name,
                columns.item,
                y,
                {
                    width: 220
                }
            );


        doc.text(
            String(item.quantity),
            columns.qty,
            y
        );


        doc.text(
            formatINR(item.unit_price),
            columns.price,
            y
        );


        doc.text(
            formatINR(item.taxable_amount),
            columns.taxable,
            y
        );


        doc.text(
            `${gstRate}%`,
            columns.gst,
            y
        );


        doc.text(
            formatINR(item.total),
            columns.total,
            y
        );


        y += 28;


        // Avoid overflowing page
        if (y > 700) {

            doc.addPage();

            y = 50;
        }
    }


    // ----------------------------------------------
    // SUMMARY
    // ----------------------------------------------

    y += 10;


    doc
        .moveTo(350, y)
        .lineTo(555, y)
        .stroke();


    y += 15;


    doc
        .fontSize(10)
        .font(FONT_PATH)
        .text(
            `Taxable Amount: ${formatINR(bill.subtotal)}`,
            350,
            y,
            {
                width: 205,
                align: "right"
            }
        );


    y += 18;


    doc.text(
        `CGST: ${formatINR(bill.cgst)}`,
        350,
        y,
        {
            width: 205,
            align: "right"
        }
    );


    y += 18;


    doc.text(
        `SGST: ${formatINR(bill.sgst)}`,
        350,
        y,
        {
            width: 205,
            align: "right"
        }
    );


    y += 22;


    doc
        .font(FONT_PATH)
        .fontSize(13)
        .text(
            `TOTAL: ${formatINR(bill.total)}`,
            350,
            y,
            {
                width: 205,
                align: "right"
            }
        );


    // ----------------------------------------------
    // TAX BREAKUP
    // ----------------------------------------------

    y += 45;


    doc
        .fontSize(10)
        .font(FONT_PATH)
        .text(
            "Tax Breakup"
        );


    y += 18;


    doc
        .fontSize(9)
        .font(FONT_PATH)
        .text(
            "GST Rate",
            40,
            y
        )
        .text(
            "Taxable",
            180,
            y
        )
        .text(
            "CGST",
            300,
            y
        )
        .text(
            "SGST",
            390,
            y
        )
        .text(
            "Total Tax",
            480,
            y
        );


    y += 18;


    // ----------------------------------------------
    // GROUP GST BY RATE
    // ----------------------------------------------

    const gstGroups = {};

    for (const item of items) {

        const rate =
            Number(item.gst_rate);

        if (!gstGroups[rate]) {

            gstGroups[rate] = {
                taxable: 0,
                cgst: 0,
                sgst: 0
            };
        }


        gstGroups[rate].taxable +=
            item.taxable_amount;

        gstGroups[rate].cgst +=
            item.cgst;

        gstGroups[rate].sgst +=
            item.sgst;
    }


    for (const rate of Object.keys(gstGroups)) {

        const group =
            gstGroups[rate];


        doc
            .text(
                `${rate}%`,
                40,
                y
            )
            .text(
                formatINR(group.taxable),
                180,
                y
            )
            .text(
                formatINR(group.cgst),
                300,
                y
            )
            .text(
                formatINR(group.sgst),
                390,
                y
            )
            .text(
                formatINR(
                    group.cgst +
                    group.sgst
                ),
                480,
                y
            );


        y += 18;
    }


    // ----------------------------------------------
    // FOOTER
    // ----------------------------------------------

    doc
        .fontSize(8)
        .font(FONT_PATH)
        .text(
            "Thank you for shopping with us.",
            40,
            760,
            {
                align: "center",
                width: 515
            }
        );


    doc.end();


    return new Promise(
        (resolve, reject) => {

            stream.on(
                "finish",
                () => {

                    resolve({
                        success: true,
                        filePath,
                        filename,
                        invoiceNumber:
                            bill.invoice_number
                    });

                }
            );


            stream.on(
                "error",
                reject
            );
        }
    );
}


module.exports = {
    generateInvoicePDF
};