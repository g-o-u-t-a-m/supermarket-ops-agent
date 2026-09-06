require("dotenv").config();

const OpenAI = require("openai");

const toolsModule = require("./tools");


// ============================================================
// OPENROUTER CLIENT
// ============================================================

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});


// ============================================================
// TOOL MAPPING
// OpenRouter names → tools.js functions
// ============================================================

const toolFunctions = {

    search_products: toolsModule.searchProducts,
    get_product: toolsModule.getProduct,
    get_stock: toolsModule.getStock,
    get_low_stock: toolsModule.getLowStock,
    receive_stock: toolsModule.receiveStock,

    create_bill: toolsModule.createBill,
    add_bill_item: toolsModule.addBillItem,
    update_bill_item: toolsModule.updateBillItem,
    remove_bill_item: toolsModule.removeBillItem,
    get_bill: toolsModule.getBill,
    get_last_finalized_bill: toolsModule.getLastFinalizedBill,
    finalize_bill: toolsModule.finalizeBill,

    find_customer: toolsModule.findCustomer,
    create_customer: toolsModule.createCustomer,
    get_customer_balance: toolsModule.getCustomerBalance,
    add_credit: toolsModule.addCredit,
    record_khata_payment: toolsModule.recordKhataPayment,
    get_credit_history: toolsModule.getCreditHistory,

    get_daily_sales: toolsModule.getDailySales,
    close_day: toolsModule.closeDay,
    get_top_products: toolsModule.getTopProducts,
    get_weekly_summary: toolsModule.getWeeklySummary,
    get_stock_health: toolsModule.getStockHealth,

    set_preference: toolsModule.setPreference,
    get_preference: toolsModule.getPreference,
    get_all_preferences: toolsModule.getAllPreferences,

    generate_invoice: toolsModule.generateInvoice,
    generate_analysis_deck: toolsModule.generateAnalysisDeck
};


// ============================================================
// CONVERT GEMINI TOOLS → OPENAI FORMAT
// ============================================================

function getTools(functionDeclarations) {

    return functionDeclarations.map(tool => ({

        type: "function",

        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }

    }));
}


// ============================================================
// OPENROUTER AGENT
// ============================================================

async function runOpenAIAgent(
    message,
    previousMessages = null,
    functionDeclarations = [],
    SYSTEM_PROMPT = ""
) {

    let messages;

    if (
        previousMessages &&
        previousMessages.length > 0
    ) {

        messages = [
            ...previousMessages,
            {
                role: "user",
                content: message
            }
        ];

    } else {

        messages = [

            {
                role: "system",
                content: SYSTEM_PROMPT
            },

            {
                role: "user",
                content: message
            }

        ];
    }


    const openRouterTools =
        getTools(functionDeclarations);

    const artifacts = [];


    // ========================================================
    // AGENT LOOP
    // ========================================================

    for (
        let round = 0;
        round < 10;
        round++
    ) {

        console.log(
            `\n[OPENROUTER] Round ${round + 1}`
        );


        const response =
            await client.chat.completions.create({

                model: "openai/gpt-4.1-mini",

                messages,

                tools: openRouterTools,

                tool_choice: "auto",

                max_tokens: 500

            });


        const assistantMessage =
            response.choices[0].message;


        messages.push(
            assistantMessage
        );


        // ====================================================
        // NO TOOL CALL
        // ====================================================

        if (
            !assistantMessage.tool_calls ||
            assistantMessage.tool_calls.length === 0
        ) {

            return {

                success: true,

                text:
                    assistantMessage.content ||
                    "I couldn't generate a response.",

                messages,

                artifacts

            };
        }


        // ====================================================
        // EXECUTE TOOL CALLS
        // ====================================================

        for (
            const toolCall
            of assistantMessage.tool_calls
        ) {

            const toolName =
                toolCall.function.name;


            console.log(
                `\n[OPENROUTER TOOL] ${toolName}`
            );


            console.log(
                "[ARGUMENTS]",
                toolCall.function.arguments
            );


            // IMPORTANT:
            // Use our mapping instead of toolsModule[toolName]

            const fn =
                toolFunctions[toolName];


            // =================================================
            // UNKNOWN TOOL
            // =================================================

            if (!fn) {

                console.error(
                    `[UNKNOWN TOOL] ${toolName}`
                );


                messages.push({

                    role: "tool",

                    tool_call_id:
                        toolCall.id,

                    content:
                        JSON.stringify({

                            error:
                                `Unknown tool: ${toolName}`

                        })

                });

                continue;
            }


            // =================================================
            // EXECUTE TOOL
            // =================================================

            try {

                const args =
                    JSON.parse(
                        toolCall.function.arguments ||
                        "{}"
                    );


                const result =
                    await fn(args);


                console.log(
                    "[OPENROUTER RESULT]",
                    JSON.stringify(result)
                );


                // =================================================
                // ARTIFACT
                // =================================================

                if (
                    result &&
                    result.success &&
                    result.filePath
                ) {

                    artifacts.push({

                        type:
                            result.fileType ||
                            "file",

                        path:
                            result.filePath,

                        filename:
                            result.filename ||
                            undefined

                    });


                    console.log(
                        "[ARTIFACT]",
                        result.filePath
                    );
                }


                // =================================================
                // SEND TOOL RESULT BACK TO MODEL
                // =================================================

                messages.push({

                    role: "tool",

                    tool_call_id:
                        toolCall.id,

                    content:
                        JSON.stringify(result)

                });


            } catch (error) {

                console.error(
                    `[OPENROUTER TOOL ERROR] ${toolName}:`,
                    error.message
                );


                messages.push({

                    role: "tool",

                    tool_call_id:
                        toolCall.id,

                    content:
                        JSON.stringify({

                            error:
                                error.message

                        })

                });
            }
        }
    }


    // ==========================================================
    // TOO MANY ROUNDS
    // ==========================================================

    return {

        success: false,

        text:
            "I couldn't complete the operation.",

        messages,

        artifacts

    };
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    runOpenAIAgent
};