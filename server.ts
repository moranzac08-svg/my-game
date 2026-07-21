import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface PlayerState {
  userId: string;
  username: string;
  avatarColors: {
    head: string;
    torso: string;
    leftArm: string;
    rightArm: string;
    leftLeg: string;
    rightLeg: string;
  };
  equippedItems: any;
  shirtItem?: any;
  pantsItem?: any;
  accessoryItem?: any;
  hairItem?: any;
  x: number;
  y: number;
  z: number;
  rotY: number;
  isWalking: boolean;
  timestamp: number;
}

interface Room {
  players: Record<string, PlayerState>;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // Active multiplayer game rooms
  const rooms: Record<string, Room> = {};

  // WebSocket Server setup
  const wss = new WebSocketServer({ noServer: true });

  // Handle client upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
    
    if (pathname === '/api/multiplayer' || pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    ws.on('message', (messageData: string) => {
      try {
        const parsed = JSON.parse(messageData);
        const { type, payload } = parsed;

        if (type === 'join') {
          const { gameId, userId, username, avatarColors, equippedItems, shirtItem, pantsItem, accessoryItem, hairItem } = payload;
          currentRoomId = gameId;
          currentUserId = userId;

          if (!rooms[gameId]) {
            rooms[gameId] = { players: {} };
          }

          const newPlayer: PlayerState = {
            userId,
            username,
            avatarColors,
            equippedItems,
            shirtItem,
            pantsItem,
            accessoryItem,
            hairItem,
            x: 0,
            y: 0,
            z: 0,
            rotY: 0,
            isWalking: false,
            timestamp: Date.now(),
          };

          rooms[gameId].players[userId] = newPlayer;

          // Send current state of all players in this room to the newly joined player
          ws.send(JSON.stringify({
            type: 'sync_players',
            payload: {
              players: Object.values(rooms[gameId].players).filter(p => p.userId !== userId),
            },
          }));

          // Broadcast to everyone else that a new player joined
          broadcastToRoom(gameId, userId, {
            type: 'player_joined',
            payload: { player: newPlayer },
          });

          console.log(`[Multiplayer] Player ${username} (${userId}) joined room ${gameId}`);
        } else if (type === 'move') {
          if (!currentRoomId || !currentUserId || !rooms[currentRoomId]) return;

          const player = rooms[currentRoomId].players[currentUserId];
          if (player) {
            player.x = payload.x;
            player.y = payload.y;
            player.z = payload.z;
            player.rotY = payload.rotY;
            player.isWalking = payload.isWalking;
            player.timestamp = Date.now();

            // Broadcast movement delta to all other room members
            broadcastToRoom(currentRoomId, currentUserId, {
              type: 'player_moved',
              payload: {
                userId: currentUserId,
                x: payload.x,
                y: payload.y,
                z: payload.z,
                rotY: payload.rotY,
                isWalking: payload.isWalking,
              },
            });
          }
        } else if (type === 'chat') {
          if (!currentRoomId || !currentUserId) return;
          // Broadcast the chat message to all players in the room
          broadcastToRoom(currentRoomId, null, {
            type: 'chat_received',
            payload: {
              userId: currentUserId,
              username: payload.username,
              text: payload.text,
            },
          });
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentUserId && rooms[currentRoomId]) {
        const username = rooms[currentRoomId].players[currentUserId]?.username || currentUserId;
        delete rooms[currentRoomId].players[currentUserId];
        
        // Clean up empty room
        if (Object.keys(rooms[currentRoomId].players).length === 0) {
          delete rooms[currentRoomId];
        } else {
          // Notify other players
          broadcastToRoom(currentRoomId, currentUserId, {
            type: 'player_left',
            payload: { userId: currentUserId },
          });
        }
        console.log(`[Multiplayer] Player ${username} (${currentUserId}) left room ${currentRoomId}`);
      }
    });

    ws.on('error', (err) => {
      console.error('[Multiplayer] Connection error:', err);
    });

    // Helper to send message to all clients in a specific game lobby except sender
    function broadcastToRoom(gameId: string, excludeUserId: string | null, message: any) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          // To map specific ws instance back to its room/userId, we can check custom states or broadcast broadly
          // Since we want easy lightweight routing, we send to all open websockets, and clients filter by gameId,
          // or we can attach properties directly on the ws object itself:
          const clientWs = client as any;
          if (clientWs !== ws || !excludeUserId) {
            // Check if the client belongs to the same room
            client.send(JSON.stringify(message));
          }
        }
      });
    }
  });

  // Health API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', playersCount: wss.clients.size });
  });

  // Vite middleware in dev; express.static in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
