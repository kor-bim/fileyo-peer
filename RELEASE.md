# Release Guide

## Checklist

1. `bun run dev`로 서버 정상 구동 확인
2. `/health` 확인
3. Peer 연결/해제 로그 확인
4. Relay 경로(`/relay`) 업그레이드 동작 확인

## Tag and Release

```bash
git checkout master
git pull --ff-only
git tag -a vX.Y.Z -m "release: vX.Y.Z"
git push origin master
git push origin vX.Y.Z
```

## Notes Template

- Added:
- Changed:
- Fixed:
