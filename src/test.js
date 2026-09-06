const inventory = require("./tools/inventory");

console.log("\nSEARCH MAGGI\n");

console.log(
    inventory.searchProducts("Maggi")
);

console.log("\nLOW STOCK\n");

console.log(
    inventory.getLowStock()
);