require("dotenv").config();

async function test() {
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    try {
        const response = await ai.interactions.create({
            model: "gemini-3.6-flash",
            input: "Reply with exactly: Gemini is working"
        });

        console.log("SUCCESS:");
        console.log(response.output_text);

    } catch (error) {
        console.log("GEMINI ERROR:");
        console.log("Status:", error.status || error.statusCode);
        console.log("Message:", error.message);
    }
}

test();