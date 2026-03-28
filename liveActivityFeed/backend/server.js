const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let events = [];
const maxEvents = 50;
let client = null;

// Middleware：處理 JSON body
app.use(express.json());

// 靜態檔案 (前端)
app.use(express.static(path.join(__dirname, '../frontend')));
// WebSocket 連線
wss.on('connection', (ws) => {
  console.log('Client connected');
  client = ws;
  if (client && client.readyState === 1) {
      try{
        client.send(JSON.stringify(events));
      }catch(err){
        console.error("WebSocket send error:", err);
      }
  }
  // 當 client 斷線時，清空 reference
  ws.on("close", () => {
    if (client === ws) {
      client = null;
    }
  });
});

app.post("/createEvent",(req, res)=>{
    try{
        const event = req.body;
        if (!event) {
            return res.status(400).json({ error: "Invalid event" });
        }
        // Buffer full of only high-priority events → reject
        const highEvents = events.filter(e => e.priority === "high");
        if (highEvents.length === maxEvents) {
            client.send(JSON.stringify({ status:429}));
            return res.status(429).json({ error: "Buffer full of high-priority events" });
        }

        // Buffer not full → accept directly
        if(events.length < maxEvents){
            events.unshift(event);
            if (client && client.readyState === 1) {
            client.send(JSON.stringify({status:201,event:event}));
            }
            return res.status(201).json({ event });
        } else {
            // Buffer full → drop oldest low first
            const lowEvents = events.filter(e => e.priority === "low");
            if (lowEvents.length > 0) {
            const oldestLow = lowEvents.reduce((a, b) => a.createdAt < b.createdAt ? a : b);
            events = events.filter(e => e !== oldestLow);
            events.unshift(event);
            if (client && client.readyState === 1) {
            client.send(JSON.stringify({ status:201,event:event, dropped: oldestLow }));
            }
            return res.status(201).json({ event, dropped: oldestLow });
            } else {

            // If no low → drop oldest normal
            const normalEvents = events.filter(e => e.priority === "normal");
            if (normalEvents.length > 0) {
                const oldestNormal = normalEvents.reduce((a, b) => a.createdAt < b.createdAt ? a : b);
                events = events.filter(e => e !== oldestNormal);
                events.unshift(event);
                if (client && client.readyState === 1) {
                client.send(JSON.stringify({ status:201,event:event, dropped: oldestNormal }));
                }
                return res.status(201).json({ event, dropped: oldestNormal });
            }
            }

            
        }
        return res.status(500).json({ error: "Unexpected buffer state" });
    }catch(err){
      console.error("error:", err);
    }
})

app.get("/events",(req, res)=>{
    const newEvents = [...events].sort((a,b)=>b.createdAt - a.createdAt)
    return res.status(200).json(newEvents);
})

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
