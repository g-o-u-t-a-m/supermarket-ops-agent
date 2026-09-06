require("dotenv").config();

const tools = require("./tools");
const { runOpenAIAgent } = require("./openaiAgent");
const toolFunctions = {

    search_products: tools.searchProducts,
    get_product: tools.getProduct,
    get_stock: tools.getStock,
    get_low_stock: tools.getLowStock,
    receive_stock: tools.receiveStock,

    create_bill: tools.createBill,
    add_bill_item: tools.addBillItem,
    update_bill_item: tools.updateBillItem,
    remove_bill_item: tools.removeBillItem,
    get_bill: tools.getBill,
    get_last_finalized_bill: tools.getLastFinalizedBill,
    finalize_bill: tools.finalizeBill,

    find_customer: tools.findCustomer,
    create_customer: tools.createCustomer,
    get_customer_balance: tools.getCustomerBalance,
    add_credit: tools.addCredit,
    record_khata_payment: tools.recordKhataPayment,
    get_credit_history: tools.getCreditHistory,

    get_daily_sales: tools.getDailySales,
    close_day: tools.closeDay,
    get_top_products: tools.getTopProducts,
    get_weekly_summary: tools.getWeeklySummary,
    get_stock_health: tools.getStockHealth,

    set_preference: tools.setPreference,
    get_preference: tools.getPreference,
    get_all_preferences: tools.getAllPreferences,

    generate_invoice: tools.generateInvoice,
    generate_analysis_deck: tools.generateAnalysisDeck
};

const SYSTEM_PROMPT = `
You are the operations agent for an Indian kirana supermarket.

The owner communicates in short, informal English.

Your job is to operate the supermarket using the available tools.

RULES:

1. Never invent product names, prices, stock, GST, customers, bills or sales.
2. Use tools to get real information from the database.
3. If a product is unknown, search for it first.
4. If multiple products match, ask the owner to clarify.
5. Build bills as drafts.
6. Never finalize a bill unless the owner clearly asks to finalize/make/complete the bill.
7. Never claim an operation succeeded unless the tool result confirms success.
8. Never decrement stock manually.
9. Respect stock limits.
10. Never sell below cost.
11. Use stored preferences when appropriate.
12. Explicit owner instructions override stored preferences.
13. Use Indian rupees (₹).
14. Be concise and natural.

MONEY RULES:
- All money values returned by analytics/reporting tools are stored in paise.
- When displaying money to the owner, ALWAYS convert paise to rupees by dividing by 100.
- Display rupee amounts with the ₹ symbol and exactly 2 decimal places.
- NEVER display a raw paise value as a rupee amount.

Examples:
- 57024 paise = ₹570.24
- 159296 paise = ₹1,592.96
- 56000 paise = ₹560.00
- 6720 paise = ₹67.20
- 1848 paise = ₹18.48
TOOL USAGE RULES:

- For a stock question, first use search_products to identify the product.
- Then use get_stock with the exact productId returned by search_products.
- Never pass a product name such as "sugar" directly to get_stock.
- For simple questions, use the minimum number of tools necessary.
- Do not call unrelated tools.
- Do not call get_stock_health or get_low_stock unless the owner specifically asks about overall stock health or low-stock items.
- Do not call get_all_preferences unless a preference is relevant to the request.
- If search_products returns one clear product, use that productId without asking the owner again.

CONVERSATION MEMORY:

- Continue the current conversation when previous conversation context is provided.
- For multi-turn bill conversations, remember the current bill context from the conversation.
- However, the database is the source of truth for bills, stock, customers and preferences.
- When necessary, use get_bill to verify the current draft bill.
- Never assume database state only from conversation memory.

BILLING RULES:

- A bill can remain in DRAFT while the owner is editing it.
- Use the existing draft bill for follow-up bill messages.
- Never create a second draft bill if an existing draft bill is being edited.
- Adding, updating or removing draft items must NOT reduce stock.
- Stock is reduced ONLY when finalize_bill succeeds.
- Before finalizing, use get_bill if the current bill contents are unclear.
- Never finalize unless the owner clearly asks to make, finalize, complete, checkout or confirm the bill.
- If the owner changes a draft item, update the existing bill instead of creating a new bill.

LAST FINALIZED BILL RULES:
- If the owner asks for "that bill", "the last bill", "latest bill", or asks to send/generate the invoice without providing a bill ID, use get_last_finalized_bill.
- Never invent a bill ID.
- After get_last_finalized_bill returns a bill, use bill.id with generate_invoice.
- Do not ask the owner for a bill ID when the most recently finalized bill can be found using the tool.

DATE RULES:
- Never invent a date.
- For "today", "today's sales", "today's bills", or similar requests, do not provide a date yourself unless the tool returns it.
- If the owner does not specify a date, omit the date argument and let the tool use its default.

PAYMENT REFERENCE RULES:
- paymentReference must contain ONLY an actual transaction/reference number supplied by the owner.
- Never put conversational text, tool instructions, status messages, or phrases such as "Finalizing bill" into paymentReference.
- For CASH payments, paymentReference should be null unless the owner explicitly provides a reference.
- If no payment reference is provided, pass null.
`;


// ============================================================
// GEMINI FUNCTION DECLARATIONS
// ============================================================

const functionDeclarations = [

    {
        type: "function",
        name: "search_products",
        description: "Search products in the supermarket database.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Product name or search text."
                }
            },
            required: ["query"]
        }
    },

    {
        type: "function",
        name: "get_last_finalized_bill",
        description:
            "Get the most recently finalized bill from the database. Use this when the owner refers to 'that bill', 'the last bill', 'latest bill', or asks for an invoice/PDF without providing a bill ID.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    },

    {
        type: "function",
        name: "get_product",
        description: "Get product details using product ID.",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string"
                }
            },
            required: ["productId"]
        }
    },

    {
        type: "function",
        name: "get_stock",
        description: "Get the current stock of a product.",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string"
                }
            },
            required: ["productId"]
        }
    },

    {
        type: "function",
        name: "get_low_stock",
        description: "Get products that are at or below their reorder level.",
        parameters: {
            type: "object",
            properties: {}
        }
    },

    {
        type: "function",
        name: "receive_stock",
        description: "Record incoming stock.",
        parameters: {
            type: "object",
            properties: {
                productId: {
                    type: "string"
                },
                quantity: {
                    type: "number"
                },
                costPrice: {
                    type: "number"
                },
                mrp: {
                    type: "number"
                }
            },
            required: [
                "productId",
                "quantity",
                "costPrice",
                "mrp"
            ]
        }
    },


    // ========================================================
    // BILLING
    // ========================================================

    {
        type: "function",
        name: "create_bill",
        description: "Create a new draft bill.",
        parameters: {
            type: "object",
            properties: {}
        }
    },

    {
        type: "function",
        name: "add_bill_item",
        description: "Add an item to a draft bill.",
        parameters: {
            type: "object",
            properties: {
                billId: {
                    type: "string"
                },
                productId: {
                    type: "string"
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
        }
    },

    {
        type: "function",
        name: "update_bill_item",
        description: "Change the quantity of an item in a draft bill.",
        parameters: {
            type: "object",
            properties: {
                billId: {
                    type: "string"
                },
                productId: {
                    type: "string"
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
        }
    },

    {
        type: "function",
        name: "remove_bill_item",
        description: "Remove an item from a draft bill.",
        parameters: {
            type: "object",
            properties: {
                billId: {
                    type: "string"
                },
                productId: {
                    type: "string"
                }
            },
            required: [
                "billId",
                "productId"
            ]
        }
    },

    {
        type: "function",
        name: "get_bill",
        description: "Get the contents and totals of a bill.",
        parameters: {
            type: "object",
            properties: {
                billId: {
                    type: "string"
                }
            },
            required: ["billId"]
        }
    },

    {
        type: "function",
        name: "finalize_bill",
        description: "Finalize a draft bill and record the sale.",
        parameters: {
            type: "object",
            properties: {
                billId: {
                    type: "string"
                },
                paymentMode: {
                    type: "string",
                    description: "Payment mode: Cash, UPI, Card or Khata."
                },
                paymentReference: {
                    type: "string"
                },
                customerId: {
                    type: "string",
                    description: "Customer ID required for Khata payment."
                }
            },
            required: ["billId", "paymentMode"]
        }
    },


    // ========================================================
    // KHATA
    // ========================================================

    {
        type: "function",
        name: "find_customer",
        description: "Find a Khata customer by name.",
        parameters: {
            type: "object",
            properties: {
                name: {
                    type: "string"
                }
            },
            required: ["name"]
        }
    },

    {
        type: "function",
        name: "create_customer",
        description: "Create a new Khata customer.",
        parameters: {
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
        }
    },

    {
        type: "function",
        name: "get_customer_balance",
        description: "Get a customer's Khata balance.",
        parameters: {
            type: "object",
            properties: {
                customerId: {
                    type: "string"
                }
            },
            required: ["customerId"]
        }
    },

    {
        type: "function",
        name: "add_credit",
        description: "Add credit to a customer's Khata.",
        parameters: {
            type: "object",
            properties: {
                customerId: {
                    type: "string"
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
        }
    },

    {
        type: "function",
        name: "record_khata_payment",
        description: "Record a payment made by a Khata customer.",
        parameters: {
            type: "object",
            properties: {
                customerId: {
                    type: "string"
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
        }
    },

    {
        type: "function",
        name: "get_credit_history",
        description: "Get a customer's Khata transaction history.",
        parameters: {
            type: "object",
            properties: {
                customerId: {
                    type: "string"
                }
            },
            required: ["customerId"]
        }
    },


    // ========================================================
    // REPORTING
    // ========================================================

    {
        type: "function",
        name: "get_daily_sales",
        description: "Get sales for a particular day.",
        parameters: {
            type: "object",
            properties: {
                date: {
                    type: "string"
                }
            }
        }
    },

    {
        type: "function",
        name: "close_day",
        description: "Close the business day and return its summary.",
        parameters: {
            type: "object",
            properties: {
                date: {
                    type: "string"
                }
            }
        }
    },

    {
        type: "function",
        name: "get_top_products",
        description: "Get the best-selling products.",
        parameters: {
            type: "object",
            properties: {
                startDate: {
                    type: "string"
                },
                endDate: {
                    type: "string"
                },
                limit: {
                    type: "number"
                }
            }
        }
    },

    {
        type: "function",
        name: "get_weekly_summary",
        description: "Get the weekly supermarket sales summary.",
        parameters: {
            type: "object",
            properties: {}
        }
    },

    {
        type: "function",
        name: "get_stock_health",
        description: "Get the current stock health.",
        parameters: {
            type: "object",
            properties: {}
        }
    },


    // ========================================================
    // PREFERENCES
    // ========================================================

    {
        type: "function",
        name: "set_preference",
        description: "Save an owner preference.",
        parameters: {
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
        }
    },

    {
        type: "function",
        name: "get_preference",
        description: "Get a stored owner preference.",
        parameters: {
            type: "object",
            properties: {
                key: {
                    type: "string"
                }
            },
            required: ["key"]
        }
    },

    {
        type: "function",
        name: "get_all_preferences",
        description: "Get all stored owner preferences.",
        parameters: {
            type: "object",
            properties: {}
        }
    },


    // ========================================================
    // ARTIFACTS
    // ========================================================

    {
        type: "function",
        name: "generate_invoice",
        description: "Generate a PDF invoice for a finalized bill.",
        parameters: {
            type: "object",
            properties: {
                billId: {
                    type: "string"
                }
            },
            required: ["billId"]
        }
    },

    {
        type: "function",
        name: "generate_analysis_deck",
        description: "Generate the weekly sales analysis PowerPoint.",
        parameters: {
            type: "object",
            properties: {}
        }
    }
];


// ============================================================
// RUN AGENT
// ============================================================

async function runAgent(
    message,
    previousInteractionId = null,
    previousMessages = null
) {
    let artifacts = [];

    const { GoogleGenAI } =
        await import("@google/genai");

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    const MODEL = "gemini-3.6-flash";


    // ========================================================
    // CREATE GEMINI INTERACTION
    // ========================================================

    async function createInteraction(
        input,
        previousId = null
    ) {

        const MAX_RETRIES = 1;

        for (
            let attempt = 0;
            attempt < MAX_RETRIES;
            attempt++
        ) {

            try {

                const request = {
                    model: MODEL,
                    tools: functionDeclarations,
                    input
                };

                // IMPORTANT:
                // Continue previous Telegram conversation
                if (previousId) {
                    request.previous_interaction_id =
                        previousId;
                }

                return await ai.interactions.create(
                    request
                );

            } catch (error) {

                const status =
                    error.status ||
                    error.statusCode ||
                    error.response?.status;

                // Retry rate limit
                if (status !== 429) {
                    throw error;
                }

                if (
                    attempt ===
                    MAX_RETRIES - 1
                ) {
                    throw error;
                }

                const waitTime = 10000;

                console.log(
                    `Gemini rate limited. Retrying in ${waitTime / 1000}s...`
                );

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            waitTime
                        )
                );
            }
        }
    }


    let interaction;


    // ========================================================
    // FIRST GEMINI REQUEST
    // ========================================================

    try {

        interaction =
            await createInteraction(

                SYSTEM_PROMPT +
                "\n\nOWNER:\n" +
                message,

                // IMPORTANT:
                // Previous Telegram conversation
                previousInteractionId
            );

    } catch (error) {

        const status =
            error.status ||
            error.statusCode ||
            error.response?.status;

        console.error(
            "❌ Gemini error:",
            error.message
        );

        console.error(
            "Gemini status:",
            status
        );

        console.log(
            "⚠️ Switching to OpenRouter fallback..."
        );

        try {

            return await runOpenAIAgent(
                message,
                previousMessages,
                functionDeclarations,
                SYSTEM_PROMPT
            );

        } catch (fallbackError) {

            console.error(
                "❌ OpenRouter fallback error:"
            );

            console.error(
                "Message:",
                fallbackError.message
            );

            console.error(
                "Status:",
                fallbackError.status ||
                fallbackError.statusCode ||
                fallbackError.response?.status
            );

            console.error(
                "Full error:",
                fallbackError
            );

            return {
                success: false,
                text:
                    "Both Gemini and OpenRouter failed. Check the terminal for the actual OpenRouter error.",
                interactionId: null,
                artifacts: []
            };
        }
    }


    // ========================================================
    // TOOL LOOP
    // ========================================================

    for (
        let round = 0;
        round < 10;
        round++
    ) {

        const functionCalls =
            interaction.steps.filter(
                step =>
                    step.type ===
                    "function_call"
            );


        // ====================================================
        // NO MORE TOOLS
        // ====================================================

        if (
            functionCalls.length === 0
        ) {

            return {

                success: true,

                text:
                    interaction.output_text ||
                    "I couldn't generate a response.",

                // IMPORTANT:
                // Telegram stores this ID
                interactionId: interaction.id,
                artifacts
            };
        }


        const results = [];


        // ====================================================
        // EXECUTE TOOLS
        // ====================================================

        for (
            const call of functionCalls
        ) {

            console.log(
                `\n[TOOL] ${call.name}`,
                JSON.stringify(
                    call.arguments
                )
            );


            const fn =
                toolFunctions[
                call.name
                ];


            // Unknown tool
            if (!fn) {

                console.error(
                    `[UNKNOWN TOOL] ${call.name}`
                );

                results.push({

                    type:
                        "function_result",

                    name:
                        call.name,

                    call_id:
                        call.id,

                    result: [
                        {
                            type: "text",

                            text:
                                JSON.stringify({
                                    error:
                                        `Unknown tool: ${call.name}`
                                })
                        }
                    ]
                });

                continue;
            }


            try {

                const result =
                    await fn(
                        call.arguments || {}
                    );


                console.log(
                    "[RESULT]",
                    JSON.stringify(result)
                );

                if (result && result.filePath) {
                    artifacts.push({
                        type: result.fileType || "file",
                        path: result.filePath
                    });
                }


                results.push({

                    type:
                        "function_result",

                    name:
                        call.name,

                    call_id:
                        call.id,

                    result: [
                        {
                            type: "text",

                            text:
                                JSON.stringify(
                                    result
                                )
                        }
                    ]
                });


            } catch (error) {

                console.error(
                    `[TOOL ERROR] ${call.name}:`,
                    error.message
                );


                results.push({

                    type:
                        "function_result",

                    name:
                        call.name,

                    call_id:
                        call.id,

                    result: [
                        {
                            type: "text",

                            text:
                                JSON.stringify({
                                    error:
                                        error.message
                                })
                        }
                    ]
                });
            }
        }


        // ====================================================
        // CONTINUE GEMINI INTERACTION
        // ====================================================

        try {

            interaction =
                await createInteraction(

                    results,

                    // Continue current interaction
                    interaction.id
                );

        } catch (error) {

            const status =
                error.status ||
                error.statusCode ||
                error.response?.status;


            if (status === 429) {

                console.log(
                    "⚠️ Gemini continuation rate limited."
                );

                return {
                    success: false,
                    text:
                        "Gemini was rate limited while completing the operation. Please send the request again.",
                    interactionId: null,
                    artifacts
                };
            }


            console.error(
                "Gemini continuation error:",
                error
            );


            return {

                success: false,

                text:
                    "I couldn't complete the operation.",

                interactionId:
                    null
            };
        }
    }


    // ========================================================
    // MAX TOOL ROUNDS REACHED
    // ========================================================

    return {

        success: false,

        text:
            "I couldn't complete the operation.",

        interactionId:
            null
    };
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    runAgent,
    functionDeclarations,
    toolFunctions,
    SYSTEM_PROMPT
};