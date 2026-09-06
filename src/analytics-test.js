const analytics =
    require("./tools/analytics");

const money =
    require("./utils/money");

console.log(
    "\n=============================="
);

console.log(
    "DAILY SALES"
);

console.log(
    "==============================\n"
);


const daily =
    analytics.getDailySales();

console.log(
    JSON.stringify(
        daily,
        null,
        2
    )
);


console.log(
    "\n=============================="
);

console.log(
    "TOP PRODUCTS"
);

console.log(
    "==============================\n"
);


const today =
    new Date()
        .toISOString()
        .split("T")[0];


const top =
    analytics.getTopProducts(
        today,
        today,
        10
    );

console.log(
    JSON.stringify(
        top,
        null,
        2
    )
);


console.log(
    "\n=============================="
);

console.log(
    "STOCK HEALTH"
);

console.log(
    "==============================\n"
);


console.log(
    JSON.stringify(
        analytics.getStockHealth(),
        null,
        2
    )
);


console.log(
    "\n=============================="
);

console.log(
    "WEEKLY SUMMARY"
);

console.log(
    "==============================\n"
);


console.log(
    JSON.stringify(
        analytics.getWeeklySummary(),
        null,
        2
    )
);


console.log(
    "\n=============================="
);

console.log(
    "DAILY CLOSE"
);

console.log(
    "==============================\n"
);


const close =
    analytics.closeDay();

console.log(
    JSON.stringify(
        close,
        null,
        2
    )
);

const {
    formatDailySummary,
    formatTopProducts
} = require("./utils/analyticsFormatter");

console.log(
    formatDailySummary(daily)
);

console.log(
    "\n" +
    formatTopProducts(top)
);