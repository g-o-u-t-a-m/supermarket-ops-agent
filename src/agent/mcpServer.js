const tools = require("./tools");

async function createSupermarketServer() {
    const { createSdkMcpServer, tool } =
        await import("@anthropic-ai/claude-agent-sdk");

    const { z } = await import("zod");

    return createSdkMcpServer({
        name: "supermarket",
        version: "1.0.0",

        tools: [

            tool(
                "search_products",
                "Search products in the supermarket database.",
                {
                    query: z.string()
                },
                async ({ query }) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.searchProducts({ query })
                        )
                    }]
                })
            ),

            tool(
                "get_stock",
                "Get current stock for a product.",
                {
                    productId: z.string()
                },
                async ({ productId }) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.getStock({ productId })
                        )
                    }]
                })
            ),

            tool(
                "create_bill",
                "Create a new draft bill.",
                {},
                async () => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.createBill()
                        )
                    }]
                })
            ),

            tool(
                "add_bill_item",
                "Add a product to a draft bill.",
                {
                    billId: z.string(),
                    productId: z.string(),
                    quantity: z.number()
                },
                async (args) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.addBillItem(args)
                        )
                    }]
                })
            ),

            tool(
                "update_bill_item",
                "Change quantity of an item in a draft bill.",
                {
                    billId: z.string(),
                    productId: z.string(),
                    quantity: z.number()
                },
                async (args) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.updateBillItem(args)
                        )
                    }]
                })
            ),

            tool(
                "remove_bill_item",
                "Remove an item from a draft bill.",
                {
                    billId: z.string(),
                    productId: z.string()
                },
                async (args) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.removeBillItem(args)
                        )
                    }]
                })
            ),

            tool(
                "get_bill",
                "Get details of a bill.",
                {
                    billId: z.string()
                },
                async ({ billId }) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.getBill({ billId })
                        )
                    }]
                })
            ),

            tool(
                "finalize_bill",
                "Finalize a bill and deduct stock.",
                {
                    billId: z.string(),
                    paymentMode: z.string(),
                    paymentReference: z.string().optional()
                },
                async (args) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.finalizeBill(args)
                        )
                    }]
                })
            ),

            tool(
                "find_customer",
                "Find a customer by name.",
                {
                    name: z.string()
                },
                async ({ name }) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.findCustomer({ name })
                        )
                    }]
                })
            ),

            tool(
                "get_customer_balance",
                "Get a customer's khata balance.",
                {
                    customerId: z.string()
                },
                async ({ customerId }) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.getCustomerBalance({ customerId })
                        )
                    }]
                })
            ),

            tool(
                "add_credit",
                "Add credit to a customer's khata.",
                {
                    customerId: z.string(),
                    amountRupees: z.number(),
                    reference: z.string().optional()
                },
                async (args) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.addCredit(args)
                        )
                    }]
                })
            ),

            tool(
                "record_khata_payment",
                "Record a customer payment against khata.",
                {
                    customerId: z.string(),
                    amountRupees: z.number(),
                    reference: z.string().optional()
                },
                async (args) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.recordKhataPayment(args)
                        )
                    }]
                })
            ),

            tool(
                "get_daily_sales",
                "Get sales for a day.",
                {
                    date: z.string().optional()
                },
                async ({ date }) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.getDailySales({ date })
                        )
                    }]
                })
            ),

            tool(
                "close_day",
                "Close the store day.",
                {
                    date: z.string().optional()
                },
                async ({ date }) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.closeDay({ date })
                        )
                    }]
                })
            ),

            tool(
                "get_weekly_summary",
                "Get weekly sales summary.",
                {},
                async () => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.getWeeklySummary()
                        )
                    }]
                })
            ),

            tool(
                "get_stock_health",
                "Get products that are low in stock.",
                {},
                async () => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.getStockHealth()
                        )
                    }]
                })
            ),

            tool(
                "set_preference",
                "Save an owner preference.",
                {
                    key: z.string(),
                    value: z.string()
                },
                async (args) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.setPreference(args)
                        )
                    }]
                })
            ),

            tool(
                "get_preference",
                "Get an owner preference.",
                {
                    key: z.string()
                },
                async ({ key }) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.getPreference({ key })
                        )
                    }]
                })
            ),

            tool(
                "generate_invoice",
                "Generate the actual PDF invoice for a bill.",
                {
                    billId: z.string()
                },
                async ({ billId }) => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.generateInvoice({ billId })
                        )
                    }]
                })
            ),

            tool(
                "generate_analysis_deck",
                "Generate the actual weekly sales PPTX.",
                {},
                async () => ({
                    content: [{
                        type: "text",
                        text: JSON.stringify(
                            await tools.generateAnalysisDeck()
                        )
                    }]
                })
            )
        ]
    });
}

module.exports = {
    createSupermarketServer
};