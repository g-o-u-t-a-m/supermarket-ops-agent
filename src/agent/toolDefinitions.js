const tools = require("./tools");


const toolDefinitions = [

    {
        name: "search_products",

        description:
            "Search the store catalog for products matching a name or description. " +
            "Use this before billing or receiving stock when the product ID is unknown. " +
            "Never invent a product.",

        input_schema: {
            type: "object",

            properties: {
                query: {
                    type: "string",
                    description:
                        "Product name or search text"
                }
            },

            required: ["query"]
        },

        handler:
            tools.searchProducts
    },


    {
        name: "get_product",

        description:
            "Get the authoritative product information from the database, " +
            "including price, cost, MRP, GST and stock.",

        input_schema: {
            type: "object",

            properties: {
                productId: {
                    type: "integer"
                }
            },

            required: ["productId"]
        },

        handler:
            tools.getProduct
    },


    {
        name: "get_stock",

        description:
            "Check the current stock quantity of a product.",

        input_schema: {
            type: "object",

            properties: {
                productId: {
                    type: "integer"
                }
            },

            required: ["productId"]
        },

        handler:
            tools.getStock
    },


    {
        name: "get_low_stock",

        description:
            "Return products at or below their reorder level.",

        input_schema: {
            type: "object",
            properties: {}
        },

        handler:
            tools.getLowStock
    },


    {
        name: "receive_stock",

        description:
            "Record incoming inventory. Use when the owner says stock has arrived. " +
            "The product must already exist in the catalog.",

        input_schema: {
            type: "object",

            properties: {
                productId: {
                    type: "integer"
                },

                quantity: {
                    type: "number"
                },

                costPrice: {
                    type: "number",
                    description:
                        "Cost per unit in INR"
                },

                mrp: {
                    type: "number",
                    description:
                        "MRP per unit in INR"
                }
            },

            required: [
                "productId",
                "quantity",
                "costPrice",
                "mrp"
            ]
        },

        handler:
            tools.receiveStock
    },


    {
        name: "create_bill",

        description:
            "Create a new draft bill. Stock is not changed until finalization.",

        input_schema: {
            type: "object",
            properties: {}
        },

        handler:
            tools.createBill
    },


    {
        name: "add_bill_item",

        description:
            "Add a product and quantity to a draft bill. " +
            "Do not finalize until the owner has finished editing the bill.",

        input_schema: {
            type: "object",

            properties: {

                billId: {
                    type: "integer"
                },

                productId: {
                    type: "integer"
                },

                quantity: {
                    type: "number"
                }
            },

            required: [
                "billId",
                "productId",
                "quantity"
            ]
        },

        handler:
            tools.addBillItem
    },


    {
        name: "update_bill_item",

        description:
            "Change the quantity of an item already present in a draft bill.",

        input_schema: {
            type: "object",

            properties: {

                billId: {
                    type: "integer"
                },

                productId: {
                    type: "integer"
                },

                quantity: {
                    type: "number"
                }
            },

            required: [
                "billId",
                "productId",
                "quantity"
            ]
        },

        handler:
            tools.updateBillItem
    },


    {
        name: "remove_bill_item",

        description:
            "Remove an item from a draft bill.",

        input_schema: {
            type: "object",

            properties: {

                billId: {
                    type: "integer"
                },

                productId: {
                    type: "integer"
                }
            },

            required: [
                "billId",
                "productId"
            ]
        },

        handler:
            tools.removeBillItem
    },


    {
        name: "get_bill",

        description:
            "Get the current contents and totals of a bill.",

        input_schema: {
            type: "object",

            properties: {
                billId: {
                    type: "integer"
                }
            },

            required: ["billId"]
        },

        handler:
            tools.getBill
    },


    {
        name: "finalize_bill",

        description:
            "Finalize a draft bill and record payment. " +
            "This is the operation that permanently decrements stock. " +
            "Use only when the owner has finished the bill.",

        input_schema: {
            type: "object",

            properties: {

                billId: {
                    type: "integer"
                },

                paymentMode: {
                    type: "string",
                    enum: [
                        "CASH",
                        "UPI",
                        "CARD",
                        "CREDIT"
                    ]
                },

                paymentReference: {
                    type: "string"
                }
            },

            required: [
                "billId",
                "paymentMode"
            ]
        },

        handler:
            tools.finalizeBill
    },


    {
        name: "find_customer",

        description:
            "Find a customer in the khata ledger.",

        input_schema: {
            type: "object",

            properties: {
                name: {
                    type: "string"
                }
            },

            required: ["name"]
        },

        handler:
            tools.findCustomer
    },


    {
        name: "create_customer",

        description:
            "Create a new khata customer.",

        input_schema: {
            type: "object",

            properties: {

                name: {
                    type: "string"
                },

                phone: {
                    type: "string"
                }
            },

            required: ["name"]
        },

        handler:
            tools.createCustomer
    },


    {
        name: "get_customer_balance",

        description:
            "Get the outstanding khata balance for a customer.",

        input_schema: {
            type: "object",

            properties: {
                customerId: {
                    type: "integer"
                }
            },

            required: ["customerId"]
        },

        handler:
            tools.getCustomerBalance
    },


    {
        name: "add_credit",

        description:
            "Add a debt to an existing customer's khata.",

        input_schema: {
            type: "object",

            properties: {

                customerId: {
                    type: "integer"
                },

                amountRupees: {
                    type: "number"
                },

                reference: {
                    type: "string"
                }
            },

            required: [
                "customerId",
                "amountRupees"
            ]
        },

        handler:
            tools.addCredit
    },


    {
        name: "record_khata_payment",

        description:
            "Record money paid by a customer toward an existing khata balance. " +
            "The tool refuses invalid overpayments.",

        input_schema: {
            type: "object",

            properties: {

                customerId: {
                    type: "integer"
                },

                amountRupees: {
                    type: "number"
                },

                reference: {
                    type: "string"
                }
            },

            required: [
                "customerId",
                "amountRupees"
            ]
        },

        handler:
            tools.recordKhataPayment
    },


    {
        name: "get_daily_sales",

        description:
            "Get finalized sales for a specific day.",

        input_schema: {
            type: "object",

            properties: {
                date: {
                    type: "string",
                    description:
                        "YYYY-MM-DD. Omit for today."
                }
            }
        },

        handler:
            tools.getDailySales
    },


    {
        name: "close_day",

        description:
            "Produce the daily close report containing sales, tax, payment breakdown, top products and stock health.",

        input_schema: {
            type: "object",

            properties: {
                date: {
                    type: "string"
                }
            }
        },

        handler:
            tools.closeDay
    },


    {
        name: "get_weekly_summary",

        description:
            "Get this week's sales, top products, GST and stock health for analysis.",

        input_schema: {
            type: "object",
            properties: {}
        },

        handler:
            tools.getWeeklySummary
    },


    {
        name: "get_stock_health",

        description:
            "Get overall inventory health, including low-stock and out-of-stock products.",

        input_schema: {
            type: "object",
            properties: {}
        },

        handler:
            tools.getStockHealth
    },


    {
        name: "set_preference",

        description:
            "Persist an owner preference for future chats, such as default payment or preferred product.",

        input_schema: {
            type: "object",

            properties: {

                key: {
                    type: "string"
                },

                value: {
                    type: "string"
                }
            },

            required: [
                "key",
                "value"
            ]
        },

        handler:
            tools.setPreference
    },


    {
        name: "get_preference",

        description:
            "Retrieve a persisted owner preference.",

        input_schema: {
            type: "object",

            properties: {
                key: {
                    type: "string"
                }
            },

            required: ["key"]
        },

        handler:
            tools.getPreference
    },


    {
        name: "generate_invoice",

        description:
            "Generate the finalized bill as a real GST PDF invoice.",

        input_schema: {
            type: "object",

            properties: {
                billId: {
                    type: "integer"
                }
            },

            required: ["billId"]
        },

        handler:
            tools.generateInvoice
    },


    {
        name: "generate_analysis_deck",

        description:
            "Generate a real PowerPoint sales analysis deck with charts and insights.",

        input_schema: {
            type: "object",

            properties: {}
        },

        handler:
            tools.generateAnalysisDeck
    }

];


module.exports = {
    toolDefinitions
};