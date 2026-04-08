# Chatbot API (Career Genius / Oblivious Goldfish)

A simple Node.js Express server that exposes a single POST endpoint for a chatbot powered by Google's free Gemini API (`gemini-2.5-flash`).

## Personality Rules Implemented
1. **The Break Character**: Uses `|||` for natural pauses.
2. **One Emoji Per Reply**: Every reply starts with exactly one emoji reflecting the tone.
3. **Dual Persona**: Brilliant career advice; clueless on all other topics.
4. **The Alien Moments**: Rare glitches into an invented alien language.
5. **The Elvish Moments**: Rare glitches into Tolkien's Elvish (Quenya/Sindarin).
6. **The Conflict Mentions**: Random passing mentions of an ongoing Elf vs. Alien conflict sprinkled into career advice.

## Memory System
This bot implements both Base (short-term) and Long-Term Memory:
- **Base Memory**: Sliding window of the last 10 messages (5 user/bot pairs) per session.
- **Long-Term Memory (Bonus)**: Implemented using a "Rolling Summarizer". Every 3 messages, the server triggers a background LLM process that analyzes the recent conversation history to extract new core facts about the user (e.g., job title, goals, experience). These facts are persisted in a local `long_term_memory.json` file. When the user connects again, this summary is injected directly into the active system instructions, ensuring the bot "remembers" who they are indefinitely.

## Prerequisites
- Node.js (v18+)
- A Google Gemini API Key (obtained for free from Google AI Studio)

## Installation & Running
1. Clone or download the repository.
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Rename `.env.example` to `.env` and add your Gemini API Key:
   \`\`\`env
   GEMINI_API_KEY=your_actual_key_here
   PORT=3000
   \`\`\`
4. Start the server:
   \`\`\`bash
   npm start
   # or
   node server.js
   \`\`\`

## Testing with Postman
Create a new `POST` request to `http://localhost:3000/chat`.

**Headers**:
- `Content-Type: application/json`

**Body (raw JSON)**:
\`\`\`json
{
    "sessionId": "user_123",
    "message": "Hi, I am a frontend developer trying to get a job at Google."
}
\`\`\`

You can send follow-up requests with the same `sessionId` to test the bot's memory of your persona and its shift in tone when you ask non-career questions like "How do I bake a cake?".

## System Prompt Engineering Decisions
The core personality is enforced using `systemInstruction` within the `@google/generative-ai` SDK. I used highly explicit, contrasting rules ("brilliant" vs. "spectacularly dumb") to give the model firm guardrails. Rare constraints (Alien/Elvish glitches) were probabilistically hinted at ("maybe 5% of the time") making them unpredictable. To keep the emojis strict, the prompt emphasizes "EVERY SINGLE REPLY... EXACTLY ONE EMOJI". Emphasizing these instructions creates the stark dual persona requested by the user.
