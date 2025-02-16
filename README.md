# Electron Github Release Proxy

A proxy for electron apps to download private release assets

### Start this image via `docker-compose`

```yaml
services:
  proxy:
    image: keyle/electron-github-release-proxy:latest
    environment:
      - ACCOUNT=<Put Your GitHub Username Here>
      - REPOSITORY=<Put Your Repo Here>
      - VERSION_PREFIX=<If You App Has A Prefix Put It Here>
      - TOKEN=<PAT>
    ports:
      - 3333:3333
    restart: always

```
