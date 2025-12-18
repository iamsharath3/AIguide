const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`Testing generation with: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log(`SUCCESS [${modelName}]:`, response.text());
        return true;
    } catch (error) {
        console.error(`FAILED [${modelName}]:`, error.message);
        return false;
    }
}

async function run() {
    // Try the models that were listed as available
    await testModel("gemini-2.5-flash");
    await testModel("gemini-2.0-flash");
    await testModel("gemini-1.5-flash");
}

run();
