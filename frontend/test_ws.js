const fetch = require('node-fetch');
const WebSocket = require('ws');

async function test() {
    console.log("Negotiating...");
    const res = await fetch("http://localhost:8000/hub/notifications/negotiate?negotiateVersion=1", { method: 'POST' });
    const data = await res.json();
    console.log("Negotiated:", data);

    // Attempt WebSocket
    const wsUrl = `ws://localhost:8000/hub/notifications?id=${data.connectionToken}`;
    console.log("Connecting to WS:", wsUrl);
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
        console.log("WS Opened success!");
        // send signalr handshake
        ws.send(JSON.stringify({ protocol: "json", version: 1 }) + '\u001E');
    });
    ws.on('message', m => console.log("Received:", m.toString()));
    ws.on('error', e => console.error("WS Error:", e.message));
    ws.on('close', (code, reason) => console.log("WS Closed:", code, reason.toString()));
}
test().catch(console.error);
