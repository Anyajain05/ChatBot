require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const { SYSTEM_PROMPT } = require('./prompt');
const { 
    getBaseMemory, 
    addMessageToMemory, 
    getLongTermMemory, 
    updateLongTermMemory 
} = require('./memory');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize Gemini API
if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL: GEMINI_API_KEY is not set in environment variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// User message counter to trigger long-term memory updates periodically
const messageCounters = {};

app.post('/chat', async (req, res) => {
    try {
        const { sessionId, message } = req.body;

        if (!sessionId || !message) {
            return res.status(400).json({ error: "Missing sessionId or message in request body" });
        }

        // Get long-term memory summary for this user
        const longTermSummary = getLongTermMemory(sessionId);

        // Inject long-term memory into the system prompt if it exists
        let activeSystemPrompt = SYSTEM_PROMPT;
        if (longTermSummary) {
            activeSystemPrompt += `\n\n# User Long-Term Memory (Context to remember):\n${longTermSummary}`;
        }

        // Initialize model with the dynamically constructed system prompt
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: activeSystemPrompt
        });

        // Get sliding window history
        const history = getBaseMemory(sessionId);

        // Start chat with history
        const chat = model.startChat({
            history: history
        });

        // Send the new message
        const result = await chat.sendMessage(message);
        const replyText = result.response.text();

        // Update base memory with the new exchange
        addMessageToMemory(sessionId, 'user', message);
        addMessageToMemory(sessionId, 'model', replyText);

        // Update message counter and trigger background summarization every 3 messages
        if (!messageCounters[sessionId]) {
            messageCounters[sessionId] = 0;
        }
        messageCounters[sessionId]++;

        if (messageCounters[sessionId] >= 3) {
            messageCounters[sessionId] = 0; // reset
            // Fire and forget (background process)
            updateLongTermMemory(sessionId, genAI);
        }

        return res.json({ reply: replyText });

    } catch (error) {
        console.error("Error during chat:", error);
        return res.status(500).json({ error: "An error occurred while communicating with the AI" });
    }
});

app.listen(PORT, () => {
    console.log(`Chatbot Server running on port ${PORT}`);
});
