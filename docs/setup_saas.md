# SaaS / Cloud Deployment Guide

This guide explains how to deploy the Cyber Log Management System to a cloud environment with HTTPS support.

## Deployment Options

### Option 1: Single VM Deployment

Best for: Small to medium deployments, testing

### Option 2: Container Orchestration (Kubernetes)

Best for: Large scale, high availability requirements

---

## Option 1: Single VM Deployment

### Prerequisites

- Cloud VM (AWS EC2, GCP Compute, Azure VM, DigitalOcean, etc.)
- Ubuntu 22.04 LTS
- Minimum: 4 vCPU, 8 GB RAM, 40 GB SSD
- Domain name pointing to VM's public IP
- Ports open: 80, 443, 514 (UDP/TCP)

### Step 1: Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Log out and back in, then verify
docker --version
docker compose version
```

### Step 2: Clone and Configure

```bash
# Clone repository
git clone https://github.com/Yungyingzerza/cyber-fullstack.git
cd cyber

# Configure environment
cp .env.example .env
nano .env
```

Update `.env` for production:

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 48)
DB_PASSWORD=$(openssl rand -base64 24)

# Update .env with secure values
sed -i "s/your-super-secret-jwt-key.*/$JWT_SECRET/" .env
sed -i "s/cyberpassword/$DB_PASSWORD/" .env
```

### Step 3: Setup HTTPS with Let's Encrypt

Create `docker-compose.override.yml` for HTTPS:

```yaml
version: "3.8"

services:
  # Traefik reverse proxy for HTTPS
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.insecure=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@yourdomain.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "letsencrypt:/letsencrypt"

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`cyber.yourdomain.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
    ports: [] # Remove direct port exposure

  backend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`cyber.yourdomain.com`) && PathPrefix(`/api`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
    ports:
      - "514:514/udp"
      - "514:514/tcp"
      # Remove 3000 direct exposure

volumes:
  letsencrypt:
```

### Step 4: Deploy

```bash
# Start services
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 5: Initialize and Test

```bash
# Create tenant and admin user (replace with your domain)
curl -X POST https://cyber.yourdomain.com/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "default", "description": "Default tenant"}'

curl -X POST https://cyber.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "secure-password-here",
    "role": "admin",
    "tenant_id": "default"
  }'
```

Access the dashboard at: `https://cyber.yourdomain.com`

---

## Option 2: Self-Signed Certificate (Development/Testing)

If you don't have a domain or need a quick setup:

### Generate Self-Signed Certificate

```bash
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/server.key \
  -out certs/server.crt \
  -subj "/CN=cyber.local"
```

### Configure Nginx for HTTPS

Create `nginx-ssl.conf`:

```nginx
server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

Add to `docker-compose.override.yml`:

```yaml
services:
  nginx-ssl:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - frontend
      - backend
```

---

## Cloud-Specific Guides

### AWS EC2

1. Launch EC2 instance (t3.medium or larger)
2. Configure Security Group:
   - Inbound: 22 (SSH), 80, 443, 514 (UDP/TCP)
3. Associate Elastic IP
4. Configure Route 53 for domain
5. Follow VM deployment steps above

### Google Cloud Platform

1. Create Compute Engine instance (e2-medium or larger)
2. Configure firewall rules
3. Reserve static external IP
4. Configure Cloud DNS
5. Follow VM deployment steps above

### DigitalOcean

1. Create Droplet (4GB+ RAM)
2. Configure firewall
3. Add domain to Networking
4. Follow VM deployment steps above

### Azure

1. Create Virtual Machine (Standard_B2ms or larger)
2. Configure Network Security Group
3. Configure Azure DNS
4. Follow VM deployment steps above

---

## Production Checklist

- [ ] Strong passwords in `.env`
- [ ] HTTPS enabled with valid certificate
- [ ] Firewall configured (only necessary ports open)
- [ ] Database backups configured
- [ ] Monitoring/alerting setup
- [ ] Log rotation configured
- [ ] Regular security updates scheduled
- [ ] Rate limiting enabled
- [ ] CORS properly configured

## Monitoring

### Health Check Endpoint

```bash
curl https://cyber.yourdomain.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-17T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": { "status": "ok" }
  }
}
```

### Container Health

```bash
docker compose ps
docker stats
```

## Scaling Considerations

For high traffic:

1. Use managed PostgreSQL (RDS, Cloud SQL)
2. Deploy multiple backend instances behind load balancer
3. Consider Kubernetes for orchestration
4. Implement Redis for session caching
5. Use CDN for static assets
