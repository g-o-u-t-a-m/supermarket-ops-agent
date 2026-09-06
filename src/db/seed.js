const db = require("./database");
require("./schema");

const products = [
    {
        sku: "AASH-ATTA-5KG",
        name: "Aashirvaad Atta 5kg",
        brand: "Aashirvaad",
        unit: "packet",
        isLoose: 0,
        cost: 230,
        sell: 250,
        mrp: 260,
        quantity: 20,
        reorder: 5,
        hsn: "1101",
        gst: 5
    },

    {
        sku: "TATA-SALT-1KG",
        name: "Tata Salt 1kg",
        brand: "Tata",
        unit: "packet",
        isLoose: 0,
        cost: 20,
        sell: 25,
        mrp: 28,
        quantity: 30,
        reorder: 8,
        hsn: "2501",
        gst: 5
    },

    {
        sku: "AMUL-BUTTER-100G",
        name: "Amul Butter 100g",
        brand: "Amul",
        unit: "packet",
        isLoose: 0,
        cost: 55,
        sell: 60,
        mrp: 62,
        quantity: 15,
        reorder: 5,
        hsn: "0405",
        gst: 12
    },

    {
        sku: "FORTUNE-OIL-1L",
        name: "Fortune Sunflower Oil 1L",
        brand: "Fortune",
        unit: "litre",
        isLoose: 0,
        cost: 115,
        sell: 125,
        mrp: 130,
        quantity: 20,
        reorder: 5,
        hsn: "1512",
        gst: 5
    },

    {
        sku: "MAGGI-70G",
        name: "Maggi 70g",
        brand: "Maggi",
        unit: "packet",
        isLoose: 0,
        cost: 12,
        sell: 14,
        mrp: 14,
        quantity: 30,
        reorder: 10,
        hsn: "1902",
        gst: 12
    },

    {
        sku: "PARLE-G",
        name: "Parle-G",
        brand: "Parle",
        unit: "packet",
        isLoose: 0,
        cost: 8,
        sell: 10,
        mrp: 10,
        quantity: 40,
        reorder: 10,
        hsn: "1905",
        gst: 5
    },

    {
        sku: "SURF-EXCEL",
        name: "Surf Excel",
        brand: "Surf Excel",
        unit: "packet",
        isLoose: 0,
        cost: 90,
        sell: 100,
        mrp: 105,
        quantity: 12,
        reorder: 5,
        hsn: "3402",
        gst: 18
    },

    {
        sku: "LOOSE-SUGAR",
        name: "Sugar",
        brand: null,
        unit: "kg",
        isLoose: 1,
        cost: 40,
        sell: 48,
        mrp: 48,
        quantity: 50,
        reorder: 10,
        hsn: "1701",
        gst: 0
    },

    {
        sku: "LOOSE-RICE",
        name: "Rice",
        brand: null,
        unit: "kg",
        isLoose: 1,
        cost: 45,
        sell: 55,
        mrp: 55,
        quantity: 60,
        reorder: 15,
        hsn: "1006",
        gst: 0
    },

    {
        sku: "LOOSE-DAL",
        name: "Dal",
        brand: null,
        unit: "kg",
        isLoose: 1,
        cost: 80,
        sell: 95,
        mrp: 95,
        quantity: 30,
        reorder: 8,
        hsn: "0713",
        gst: 0
    }
];

const insert = db.prepare(`
    INSERT OR IGNORE INTO products (
        sku,
        name,
        brand,
        unit,
        is_loose,
        cost_price,
        sell_price,
        mrp,
        quantity,
        reorder_level,
        hsn_code,
        gst_rate
    )
    VALUES (
        @sku,
        @name,
        @brand,
        @unit,
        @isLoose,
        @cost,
        @sell,
        @mrp,
        @quantity,
        @reorder,
        @hsn,
        @gst
    )
`);

const transaction = db.transaction(() => {
    for (const product of products) {

        insert.run({
            ...product,
            cost: Math.round(product.cost * 100),
            sell: Math.round(product.sell * 100),
            mrp: Math.round(product.mrp * 100)
        });

    }
});

transaction();

console.log("Products seeded successfully.");