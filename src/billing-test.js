const inventory = require("./tools/inventory");
const billing = require("./tools/billing");

console.log("\n==============================");
console.log("CREATE BILL");
console.log("==============================");

const newBill = billing.createBill();

console.log(newBill);

const billId = newBill.billId;


// ------------------------------------------
// FIND MAGGI
// ------------------------------------------

const maggiSearch =
    inventory.searchProducts("Maggi");

console.log("\nMAGGI:");

console.log(maggiSearch);

const maggi =
    maggiSearch.products[0];


// ------------------------------------------
// FIND SUGAR
// ------------------------------------------

const sugarSearch =
    inventory.searchProducts("Sugar");

const sugar =
    sugarSearch.products[0];


// ------------------------------------------
// ADD MAGGI
// ------------------------------------------

console.log("\nADDING 4 MAGGI");

console.log(
    billing.addBillItem(
        billId,
        maggi.id,
        4
    )
);


// ------------------------------------------
// ADD SUGAR
// ------------------------------------------

console.log("\nADDING 2 KG SUGAR");

console.log(
    billing.addBillItem(
        billId,
        sugar.id,
        2
    )
);


// ------------------------------------------
// SHOW BILL
// ------------------------------------------

console.log("\nCURRENT BILL:");

console.log(
    JSON.stringify(
        billing.getBill(billId),
        null,
        2
    )
);


// ------------------------------------------
// CHANGE MAGGI 4 → 6
// ------------------------------------------

console.log("\nCHANGING MAGGI 4 → 6");

console.log(
    billing.updateBillItem(
        billId,
        maggi.id,
        6
    )
);


// ------------------------------------------
// FINALIZE
// ------------------------------------------

console.log("\nFINALIZING BILL:");

const finalized =
    billing.finalizeBill(
        billId,
        "UPI",
        "UPI-DEMO-123",
        `finalize-${billId}`
    );

console.log(
    JSON.stringify(
        finalized,
        null,
        2
    )
);


// ------------------------------------------
// CHECK STOCK
// ------------------------------------------

console.log("\nMAGGI STOCK AFTER SALE:");

console.log(
    inventory.getStock(maggi.id)
);

console.log("\nTESTING IDEMPOTENCY:");

const retry = billing.finalizeBill(
    billId,
    "UPI",
    "UPI-DEMO-123",
    `finalize-${billId}`
);

console.log(
    JSON.stringify(
        retry,
        null,
        2
    )
);

console.log("\nMAGGI STOCK AFTER RETRY:");

console.log(
    inventory.getStock(maggi.id)
);