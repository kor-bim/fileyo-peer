import express from 'express'
import { createServer } from 'http'
import { ExpressPeerServer } from 'peer'
import { WebSocketServer, WebSocket } from 'ws'

const PORT = Number(process.env.PORT || 9000)

const app = express()

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const server = createServer(app)

// PeerJS 시그널링 서버 (루트 경로)
const peerServer = ExpressPeerServer(server, {
  allow_discovery: true
})

app.use('/', peerServer)

peerServer.on('connection', (client) => {
  console.log(`Peer connected: ${client.getId()}`)
})

peerServer.on('disconnect', (client) => {
  console.log(`Peer disconnected: ${client.getId()}`)
})

// WebSocket 릴레이 서버 (/relay 경로)
const relayWss = new WebSocketServer({ noServer: true })

// roomId -> Map<peerId, WebSocket>
const rooms = new Map<string, Map<string, WebSocket>>()

relayWss.on('connection', (ws) => {
  let myRoom: string | null = null
  let myPeerId: string | null = null

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())

      if (msg.type === 'RELAY_JOIN') {
        myRoom = msg.roomId
        myPeerId = msg.peerId
        if (!rooms.has(myRoom!)) rooms.set(myRoom!, new Map())
        rooms.get(myRoom!)!.set(myPeerId!, ws)
        console.log(`[Relay] ${myPeerId} joined room ${myRoom}`)
        return
      }

      if (msg.type === 'RELAY_SEND' && myRoom) {
        const target = rooms.get(myRoom)?.get(msg.targetPeerId)
        if (target && target.readyState === WebSocket.OPEN) {
          target.send(JSON.stringify({ type: 'RELAY_DATA', fromPeerId: myPeerId, data: msg.data }))
        }
        return
      }

      if (msg.type === 'RELAY_BROADCAST' && myRoom) {
        const room = rooms.get(myRoom)
        if (room) {
          room.forEach((client, peerId) => {
            if (peerId !== myPeerId && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'RELAY_DATA', fromPeerId: myPeerId, data: msg.data }))
            }
          })
        }
        return
      }
    } catch {
      // ignore
    }
  })

  ws.on('close', () => {
    if (myRoom && myPeerId) {
      const room = rooms.get(myRoom)
      if (room) {
        room.delete(myPeerId)
        room.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'RELAY_PEER_LEFT', peerId: myPeerId }))
          }
        })
        if (room.size === 0) rooms.delete(myRoom)
      }
      console.log(`[Relay] ${myPeerId} left room ${myRoom}`)
    }
  })
})

// PeerJS의 기존 upgrade 리스너를 보존하면서 /relay만 가로채기
const existingListeners = server.listeners('upgrade').slice()
server.removeAllListeners('upgrade')

server.on('upgrade', (request, socket, head) => {
  const url = request.url || ''
  if (url.startsWith('/relay')) {
    relayWss.handleUpgrade(request, socket, head, (ws) => {
      relayWss.emit('connection', ws, request)
    })
  } else {
    for (const listener of existingListeners) {
      listener.call(server, request, socket, head)
    }
  }
})

server.listen(PORT, () => {
  console.log(`PeerJS + Relay server running on port ${PORT}`)
})
