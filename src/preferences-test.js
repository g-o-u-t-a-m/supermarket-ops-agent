const preferences = require("./tools/preferences");

console.log("\n==============================");
console.log("PREFERENCE TEST");
console.log("==============================");


// SET
console.log("\nSetting default payment...");

console.log(
    preferences.setPreference(
        "default_payment",
        "UPI"
    )
);


// GET
console.log("\nGetting default payment...");

console.log(
    preferences.getPreference(
        "default_payment"
    )
);


// SET ANOTHER
console.log("\nSetting default atta...");

console.log(
    preferences.setPreference(
        "default_atta",
        "Aashirvaad Atta 5kg"
    )
);


// ALL
console.log("\nAll preferences:");

console.log(
    preferences.getAllPreferences()
);