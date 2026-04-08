const fs = require('fs');
const path = require('path');

const LONG_TERM_MEMORY_FILE = path.join(__dirname, 'long_term_memory.json');

// Base memory: store conversations per session ID in RAM
// For production, this should be in Redis or a DB, but in-memory is fine for this scope.
// sessions = { [sessionId]: [ { role: 'user', parts: [{ text: '...' }] }, ... ] }
const sessions = {};
const MAX_BASE_MEMORY = 10; // Keep last 10 messages (pairs of user/model)

// Initialize the long-term memory file if it doesn't exist
if (!fs.existsSync(LONG_TERM_MEMORY_FILE)) {
    fs.writeFileSync(LONG_TERM_MEMORY_FILE, JSON.stringify({}));
}

// Read long term memory from file
function getLongTermMemory(sessionId) {
    const data = JSON.parse(fs.readFileSync(LONG_TERM_MEMORY_FILE, 'utf8'));
    return data[sessionId] || "";
}

// Write long term memory to file
function saveLongTermMemory(sessionId, summaryText) {
    const data = JSON.parse(fs.readFileSync(LONG_TERM_MEMORY_FILE, 'utf8'));
    data[sessionId] = summaryText;
    fs.writeFileSync(LONG_TERM_MEMORY_FILE, JSON.stringify(data, null, 2));
}

function getBaseMemory(sessionId) {
    if (!sessions[sessionId]) {
        sessions[sessionId] = [];
    }
    return sessions[sessionId];
}

function addMessageToMemory(sessionId, role, text) {
    if (!sessions[sessionId]) {
        sessions[sessionId] = [];
    }
    
    sessions[sessionId].push({
        role: role === 'system' ? 'user' : role, // gemini expects the history roles to alternate strictly as user/model, we shouldn't send 'system' here.
        parts: [{ text }]
    });

    // Keep only the last MAX_BASE_MEMORY messages
    if (sessions[sessionId].length > MAX_BASE_MEMORY) {
        // Remove the oldest user-model pair to keep alternating roles intact
        sessions[sessionId].splice(0, 2);
    }
}

// Summarize function for long-term memory
// This function gets called periodically (e.g., every 5 user messages)
// It uses a separate model instance to summarize new facts about the user.
async function updateLongTermMemory(sessionId, genAI) {
    const history = getBaseMemory(sessionId);
    if (history.length < 4) return; // Not enough context to summarize yet

    const currentMemory = getLongTermMemory(sessionId);
    
    // Construct prompt to extract facts
    const extractPrompt = `
You are a memory extractor. 
Here is an existing summary of what we know about the user:
"${currentMemory}"

Here is the recent conversation history:
${JSON.stringify(history.map(m => m.role + ': ' + m.parts[0].text))}

Your task is to update the summary with any NEW factual information learned about the user in this history (e.g., career goals, job title, skills, preferences). 
Do NOT include the bot's quirks or replies. Only focus on the user.
Combine the new facts with the existing summary into a single, concise paragraph. 
If nothing new is learned, just output the existing summary exactly.
`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(extractPrompt);
        const newSummary = result.response.text().trim();
        saveLongTermMemory(sessionId, newSummary);
        console.log(`[Memory] Updated long-term memory for session ${sessionId}`);
    } catch (error) {
        console.error("[Memory] Failed to update long-term memory", error);
    }
}

module.exports = {
    getBaseMemory,
    addMessageToMemory,
    getLongTermMemory,
    updateLongTermMemory
};
