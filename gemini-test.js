require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

async function main() {
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: "Reply with exactly: GEMINI WORKS"
        });

        console.log("SUCCESS:", response.text);
    } catch (error) {
        console.log("FAILED");
        console.log("Status:", error.status || error.statusCode);
        console.log("Message:", error.message);
    }
}

main();