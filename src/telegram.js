require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
require("./db/seed");
const { runAgent } = require("./agent/agent");


const bot = new TelegramBot(
    process.env.TELEGRAM_BOT_TOKEN,
    { polling: true }
);


// ============================================================
// CONVERSATION MEMORY
// ============================================================

const conversations = new Map();


// ============================================================
// START
// ============================================================

bot.onText(/^\/start$/, async (msg) => {

    const chatId = msg.chat.id;

    await bot.sendMessage(
        chatId,
        `🏪 Kirana Ops Agent ready.

Send commands like:

• how much sugar is left?
• what's running out?
• 50 Maggi came in, cost ₹12, MRP ₹14
• make a bill: 2kg sugar, 4 Maggi, UPI
• Ramesh paid ₹300
• today's sales?
• send me that bill as a PDF
• make this week's sales analysis deck

Use /new to start a new conversation.`
    );
});


// ============================================================
// NEW CONVERSATION
// ============================================================

bot.onText(/^\/new$/, async (msg) => {

    const chatId = msg.chat.id;

    conversations.delete(chatId);

    await bot.sendMessage(
        chatId,
        "🆕 New conversation started.\n\nYour store data, bills, stock, khata and preferences are still saved."
    );
});


// ============================================================
// MAIN MESSAGE HANDLER
// ============================================================

bot.on("message", async (msg) => {

    const chatId = msg.chat.id;
    const text = msg.text;


    // Ignore commands
    if (!text || text.startsWith("/")) {
        return;
    }


    try {

        await bot.sendChatAction(
            chatId,
            "typing"
        );


        // ====================================================
        // LOAD PREVIOUS CONVERSATION
        // ====================================================

        const conversation =
            conversations.get(chatId) || {};


        const previousInteractionId =
            conversation.geminiInteractionId || null;


        const previousMessages =
            conversation.openRouterMessages || null;


        console.log(
            "\n========================================"
        );

        console.log(
            "[TELEGRAM] Chat ID:",
            chatId
        );

        console.log(
            "[MESSAGE]",
            text
        );

        console.log(
            "[GEMINI MEMORY]",
            previousInteractionId
        );

        console.log(
            "[OPENROUTER MEMORY]",
            previousMessages
                ? previousMessages.length
                : 0
        );

        console.log(
            "========================================"
        );


        // ====================================================
        // RUN AGENT
        // ====================================================

        const result =
            await runAgent(
                text,
                previousInteractionId,
                previousMessages
            );


        // ====================================================
        // ERROR
        // ====================================================

        if (!result.success) {

            await bot.sendMessage(
                chatId,
                result.text
            );

            return;
        }


        // ====================================================
        // SAVE CONVERSATION
        // ====================================================

        conversations.set(
            chatId,
            {

                geminiInteractionId:
                    result.interactionId || null,

                openRouterMessages:
                    result.messages ||
                    previousMessages ||
                    null
            }
        );


        // ====================================================
        // SEND TEXT RESPONSE
        // ====================================================

        await bot.sendMessage(
            chatId,
            result.text
        );


        // ====================================================
        // SEND FILES
        // ====================================================

        if (result.artifacts) {

            for (
                const artifact
                of result.artifacts
            ) {

                await bot.sendDocument(
                    chatId,
                    artifact.path
                );
            }
        }


    } catch (error) {

        console.error(
            "Telegram error:",
            error
        );


        await bot.sendMessage(
            chatId,
            "Something went wrong while processing that request."
        );
    }
});


console.log(
    "🤖 Telegram supermarket agent is running..."
);