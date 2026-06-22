# Deployment Guide — TrackMa

## Docker Compose (Current — Development & Staging)

The project ships with `docker-compose.yml` for running the full stack locally.

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f api
docker compose logs -f gps-ingestion

# Stop all services
docker compose down

# Stop and remove volumes (DESTROYS ALL DATA)
docker compose down -v
```

## Production Docker Compose

For a single-server production deployment, create `docker-compose.prod.yml`:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./infra/nginx/certs:/etc/nginx/certs
    depends_on:
      - api
      - web

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # No external port — only accessible within Docker network

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

  mosquitto:
    image: eclipse-mosquitto:2
    restart: always
    ports:
      - "1883:1883"
    volumes:
      - ./infra/mosquitto/mosquitto.prod.conf:/mosquitto/config/mosquitto.conf
      - ./infra/mosquitto/passwd:/mosquitto/config/passwd

  api:
    image: ghcr.io/rhorba/track.ma-api:latest
    restart: always
    env_file: .env.prod
    depends_on:
      - postgres
      - redis

  gps-ingestion:
    image: ghcr.io/rhorba/track.ma-gps:latest
    restart: always
    env_file: .env.prod
    depends_on:
      - redis
      - mosquitto

  web:
    image: ghcr.io/rhorba/track.ma-web:latest
    restart: always
    env_file: .env.prod

volumes:
  postgres_data:
  redis_data:
```

### Nginx Configuration (`infra/nginx/nginx.conf`)

```nginx
events {}

http {
  upstream api {
    server api:3001;
  }

  upstream web {
    server web:3000;
  }

  server {
    listen 80;
    server_name trackma.ma www.trackma.ma;
    return 301 https://$host$request_uri;
  }

  server {
    listen 443 ssl;
    server_name trackma.ma www.trackma.ma;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # Frontend
    location / {
      proxy_pass http://web;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
      proxy_pass http://api;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket (Socket.IO)
    location /fleet {
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
    }
  }
}
```

## Deploying to a VPS (DigitalOcean / Hetzner)

### 1. Provision the Server

Minimum specs for MVP:
- **2 vCPU, 4GB RAM** (DigitalOcean Droplet: ~$24/month)
- **Ubuntu 24.04 LTS**
- Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 1883 (MQTT)

### 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 3. Clone the Repo

```bash
git clone https://github.com/rhorba/track.ma.git /opt/trackma
cd /opt/trackma
```

### 4. Create Production .env

```bash
cp .env.example .env.prod
nano .env.prod  # Fill in all production values
```

Critical production values:
```env
NODE_ENV=production
DATABASE_URL=postgresql://trackma:STRONG_PASSWORD@postgres:5432/trackma
REDIS_URL=redis://:REDIS_PASSWORD@redis:6379
JWT_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
APP_URL=https://trackma.ma
NEXTAUTH_URL=https://trackma.ma
NEXT_PUBLIC_API_URL=https://trackma.ma
```

Generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot

# Get certificate (stop nginx first if running)
sudo certbot certonly --standalone -d trackma.ma -d www.trackma.ma

# Certificates are at:
# /etc/letsencrypt/live/trackma.ma/fullchain.pem
# /etc/letsencrypt/live/trackma.ma/privkey.pem

# Copy to project
mkdir -p infra/nginx/certs
cp /etc/letsencrypt/live/trackma.ma/fullchain.pem infra/nginx/certs/
cp /etc/letsencrypt/live/trackma.ma/privkey.pem infra/nginx/certs/
```

### 6. Deploy

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### 7. Verify

```bash
curl https://trackma.ma/api/health     # Should return { "status": "ok" }
docker compose -f docker-compose.prod.yml ps   # All services should be "Up"
```

## Continuous Deployment (GitHub Actions)

The CI pipeline in `.github/workflows/ci.yml` runs tests and builds on every push. To add automatic deployment to your VPS:

```yaml
  deploy:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/trackma
            git pull origin main
            docker compose -f docker-compose.prod.yml up --build -d
```

Add to GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.

## Database Backups

Set up automated PostgreSQL backups:

```bash
# Create backup script at /opt/trackma/scripts/backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U trackma trackma \
  | gzip > /backups/trackma_$DATE.sql.gz

# Keep last 30 days
find /backups -name "trackma_*.sql.gz" -mtime +30 -delete
```

```bash
# Add to crontab (daily at 2am)
crontab -e
0 2 * * * /opt/trackma/scripts/backup.sh
```

## Monitoring (Planned Sprint 6)

- **Uptime**: UptimeRobot free tier — monitor `https://trackma.ma/api/health`
- **Logs**: `docker compose logs -f --tail=100`
- **Metrics**: Prometheus + Grafana (optional, Sprint 6)

## Rollback

```bash
# Roll back to the previous Docker image
docker compose -f docker-compose.prod.yml down
git checkout HEAD~1
docker compose -f docker-compose.prod.yml up --build -d
```

Or use git tags for versioned rollbacks:
```bash
git checkout v0.1.0
docker compose -f docker-compose.prod.yml up --build -d
```
