async function ask(message) {
    console.log(`\n\x1b[36mUser:\x1b[0m ${message}`);
    const res = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: "demo_user", message })
    });
    const data = await res.json();
    console.log(`\x1b[32mBot:\x1b[0m ${data.reply}`);
    return data.reply;
}

async function runDemo() {
    console.log("\x1b[35m=== CHATBOT DEMO STARTING ===\x1b[0m");

    await ask("Hi! I'm an accountant looking to switch to UX Design, any tips?");
    
    // Wait briefly
    await new Promise(r => setTimeout(r, 1000));
    
    await ask("By the way, what is your favorite color of the alphabet, also how do birds fly?");
    
    // Wait briefly
    await new Promise(r => setTimeout(r, 1000));

    await ask("Thanks for that... anyway, should I put my UX portfolio link at the top of my resume or at the bottom?");
}

runDemo().catch(console.error);
