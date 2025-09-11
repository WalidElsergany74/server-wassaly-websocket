/* Deprecated: Kept for backward compatibility; use server/socket-server.mjs */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createServer } = require("http");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Server } = require("socket.io");

const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 4000;
const ALLOWED_ORIGIN = process.env.WS_CORS_ORIGIN || "*";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// In-memory presence store for online couriers
/**
 * onlineCouriers: Map<userId, {
 *   id: number|string,
 *   username: string,
 *   lat: number,
 *   lag: number,
 *   available: boolean,
 *   socketId: string
 * }>
 */
const onlineCouriers = new Map();

io.on("connection", (socket) => {
  // Forward any order update to all clients
  socket.on("order:update", (payload) => {
    io.emit("orderUpdated", payload);
  });

  // Courier comes online and shares initial state
  socket.on("courier:online", (courier) => {
    // courier: { id, username, lat, lag, available }
    if (!courier || courier.available !== true) return;
    onlineCouriers.set(String(courier.id), {
      ...courier,
      socketId: socket.id,
    });
    io.emit("courier:update", {
      type: "online",
      courier: onlineCouriers.get(String(courier.id)),
    });
    // Optionally send full list to the newly connected client
    socket.emit("couriers:list", Array.from(onlineCouriers.values()));
  });

  // Location stream from courier
  socket.on("courier:location", (payload) => {
    // payload: { id, lat, lag }
    if (!payload || payload.id == null) return;
    const key = String(payload.id);
    const existing = onlineCouriers.get(key);
    if (existing) {
      existing.lat = payload.lat;
      existing.lag = payload.lag;
      existing.socketId = socket.id;
      onlineCouriers.set(key, existing);
      io.emit("courier:update", { type: "location", courier: existing });
    }
  });

  // Toggle availability
  socket.on("courier:availability", ({ id, available }) => {
    if (id == null) return;
    const key = String(id);
    const existing = onlineCouriers.get(key);
    if (available) {
      const updated = { ...(existing || {}), id, available: true, socketId: socket.id };
      onlineCouriers.set(key, updated);
      io.emit("courier:update", { type: "online", courier: updated });
    } else {
      onlineCouriers.delete(key);
      io.emit("courier:update", { type: "offline", courier: { id } });
    }
  });

  socket.on("disconnect", () => {
    // Remove courier by socket id if present
    for (const [key, value] of onlineCouriers.entries()) {
      if (value.socketId === socket.id) {
        onlineCouriers.delete(key);
        io.emit("courier:update", { type: "offline", courier: { id: value.id } });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[ws] Socket.IO server listening on :${PORT}`);
});


