# Wasallny WebSocket Server

A Socket.IO WebSocket server for realtime courier presence and order updates.

## Requirements
- Node.js 18+

## Environment variables
Create a `.env` file in this folder with:

```
# WebSocket server port
WS_PORT=4000

# Allowed CORS origin for Socket.IO (Next.js site URL)
# e.g. http://localhost:3000 or https://your-domain.com
WS_CORS_ORIGIN=http://localhost:3000
```

Note: `.env` is git-ignored. If you want an example file, copy the above into `.env.example` locally.

## Install & Run
```bash
npm install
node socket-server.mjs
```

You should see:
```
[ws] Socket.IO server listening on :4000
```

## Client Config (Next.js)
Set this in the Next.js app `.env`:
```
NEXT_PUBLIC_WS_URL=http://localhost:4000
```
And use `src/lib/socket.ts` to connect.
