# Appliance Mode Setup Guide

This guide explains how to deploy the Cyber Log Management System as a standalone appliance using Docker Compose.

## Prerequisites

- Ubuntu 22.04+ (or any Linux with Docker support)
- Docker Engine 24.0+
- Docker Compose v2.20+
- Minimum: 4 vCPU, 8 GB RAM, 40 GB Disk
- Ports available: 80, 443, 514 (UDP/TCP), 3000, 5432

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/cyber.git
cd cyber
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration (IMPORTANT: Change JWT_SECRET!)
nano .env
```

Required changes for production:

```bash
# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 48)
echo "JWT_SECRET=$JWT_SECRET" >> .env

# Set a strong database password
DB_PASSWORD=your-secure-password-here
```

### 3. Start the Stack

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize First Tenant and User

```bash
# Wait for services to be healthy
sleep 10

# Create default tenant
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name": "default", "description": "Default tenant"}'

# Create admin user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password",
    "role": "admin",
    "tenant_id": "default"
  }'
```

### 5. Access the Dashboard

Open your browser and navigate to:

- **Dashboard**: http://localhost
- **API**: http://localhost:3000/api
- **API Docs**: http://localhost:3000/api/docs

## Testing the Installation

### Test Syslog Ingestion

```bash
# Send a test syslog message
echo '<134>Jan 17 12:00:00 test-host action=allow src=10.0.0.1 dst=8.8.8.8' | nc -u -w1 localhost 514

# Or use the sample script
chmod +x samples/send_syslog.sh
./samples/send_syslog.sh
```

### Test HTTP API Ingestion

```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your-password"}' \
  | jq -r '.token')

# Post an event
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "source": "api",
    "event_type": "test_event",
    "severity": 3,
    "user": "test-user",
    "src_ip": "192.168.1.1"
  }'
```

### Test with Python Script

```bash
# Install requirements
pip3 install requests

# Run sample script
python3 samples/post_logs.py --email admin@example.com --password your-password
```

## Configuration Options

### Environment Variables

| Variable                 | Default       | Description                              |
| ------------------------ | ------------- | ---------------------------------------- |
| `DATABASE`               | cyber         | PostgreSQL database name                 |
| `DB_USER`                | cyber         | Database username                        |
| `DB_PASSWORD`            | cyberpassword | Database password                        |
| `JWT_SECRET`             | (required)    | JWT signing secret (min 32 chars)        |
| `JWT_EXPIRES_IN`         | 24h           | Token expiration time                    |
| `LOG_LEVEL`              | info          | Logging level (debug, info, warn, error) |
| `SYSLOG_ENABLED`         | true          | Enable syslog listener                   |
| `SYSLOG_PORT`            | 514           | Syslog port                              |
| `SYSLOG_TENANT`          | default       | Default tenant for syslog events         |
| `ENRICHMENT_ENABLED`     | true          | Enable enrichment pipeline               |
| `ENRICHMENT_DNS`         | true          | Enable DNS lookups                       |
| `ENRICHMENT_GEOIP`       | true          | Enable GeoIP lookups                     |
| `RETENTION_ENABLED`      | true          | Enable automatic retention               |
| `RETENTION_DEFAULT_DAYS` | 30            | Default retention period                 |

## Operations

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f frontend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Deployment

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U cyber cyber > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U cyber cyber < backup_20240117.sql
```

### Scale for Performance

```bash
# Run multiple backend instances (requires load balancer)
docker-compose up -d --scale backend=3
```

## Troubleshooting

### Services not starting

```bash
# Check container status
docker-compose ps

# Check logs for errors
docker-compose logs backend | grep -i error
```

### Database connection issues

```bash
# Test database connectivity
docker-compose exec backend wget -qO- http://localhost:3000/api/health
```

### Syslog not receiving

```bash
# Check if port is open
sudo netstat -tuln | grep 514

# Test UDP
echo "test" | nc -u -w1 localhost 514
```

### Reset everything

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Security Hardening

1. **Change default passwords** in `.env`
2. **Enable HTTPS** using a reverse proxy (nginx/traefik)
3. **Restrict network access** using firewall rules
4. **Enable rate limiting** in production
5. **Regular backups** of the database
6. **Keep Docker images updated**
