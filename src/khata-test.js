const khata = require("./tools/khata");
const { rupeesToPaise } = require("./utils/money");

console.log("\n==============================");
console.log("KHATA TEST");
console.log("==============================");


// ------------------------------------------
// CREATE RAMESH
// ------------------------------------------

console.log("\nCreating Ramesh...");

let result = khata.createCustomer(
    "Ramesh",
    "9876543210"
);

console.log(result);


// ------------------------------------------
// FIND RAMESH
// ------------------------------------------

console.log("\nFinding Ramesh...");

const search = khata.findCustomer("Ramesh");

console.log(search);

const ramesh = search.customers[0];


// ------------------------------------------
// ADD ₹500 CREDIT
// ------------------------------------------

console.log("\nAdding ₹500 credit...");

result = khata.addCredit(
    ramesh.id,
    rupeesToPaise(500),
    "SHOP-CREDIT"
);

console.log(result);


// ------------------------------------------
// CHECK BALANCE
// ------------------------------------------

console.log("\nBalance after credit:");

result = khata.getCustomerBalance(
    ramesh.id
);

console.log(
    `₹${(result.balance / 100).toFixed(2)}`
);


// ------------------------------------------
// PAY ₹300
// ------------------------------------------

console.log("\nRamesh pays ₹300...");

result = khata.recordPayment(
    ramesh.id,
    rupeesToPaise(300),
    "CASH"
);

console.log(result);


// ------------------------------------------
// FINAL BALANCE
// ------------------------------------------

console.log("\nFinal balance:");

result = khata.getCustomerBalance(
    ramesh.id
);

console.log(
    `₹${(result.balance / 100).toFixed(2)}`
);

console.log("\nTrying to pay ₹500...");

console.log(
    khata.recordPayment(
        ramesh.id,
        rupeesToPaise(500),
        "CASH"
    )
);