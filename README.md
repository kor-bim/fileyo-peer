# Fileyo Peer Server

Fileyo의 PeerJS 시그널링 + WebSocket 릴레이 서버입니다.

## Repository

- https://github.com/kor-bim/fileyo-peer

## Responsibilities

- PeerJS signaling endpoint 제공
- WebRTC 실패 시 relay WebSocket 경로 제공 (`/relay`)
- 헬스체크 엔드포인트 (`/health`)

## Endpoints

- `GET /health` -> `{"status":"ok"}`
- `WS /relay` -> 릴레이 데이터 채널
- `/*` -> PeerJS signaling

## Run

```bash
bun install
bun run dev
```

Production:

```bash
bun run start
```

Default port: `9000`

## Docker

```bash
docker build -t fileyo-peer .
docker run -p 9000:9000 fileyo-peer
```

## Release

릴리즈 절차는 `/Users/hanbim/Development/fileyo-workspace/fileyo-peer/RELEASE.md` 참조.
