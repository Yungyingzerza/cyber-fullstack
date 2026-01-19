# Cyber Log Management - Backend

A robust, multi-tenant security log aggregation and alerting API built with Node.js and PostgreSQL.

## Overview

The backend provides a comprehensive REST API for ingesting, normalizing, storing, and analyzing security logs from multiple sources. It features automatic data enrichment, real-time alerting, and multi-tenant isolation.

## Tech Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express 5.2
- **Database**: PostgreSQL with Sequelize ORM 6.37
- **Authentication**: JWT (jsonwebtoken 9.0)
- **Password Hashing**: bcrypt 6.0
- **Logging**: Winston 3.19
- **Validation**: Joi 18.0
- **File Uploads**: Multer 2.0
- **Testing**: Bun test runner
- **Documentation**: Swagger JSDoc + Swagger UI
- **Utilities**: dayjs, geoip-lite

## Features

### Core Capabilities

- Multi-tenant architecture with complete data isolation
- Role-based access control (Admin, Viewer)
- JWT authentication with configurable expiration
- RESTful API with comprehensive Swagger documentation
- Health check endpoints for monitoring

### Log Ingestion

- **Syslog Server**: UDP/TCP listener on port 514
- **HTTP API**: Single event submission with validation
- **Batch Ingestion**: Upload up to 1000 events at once
- **File Upload**: Support for JSON, syslog, and text files (max 10MB)
- Automatic source detection and normalization

### Supported Log Sources

- **Firewall**: Generic firewall logs
- **CrowdStrike**: Endpoint detection and response
- **AWS**: CloudTrail and security logs
- **Microsoft 365**: Office 365 security events
- **Active Directory**: AD authentication and access logs
- **Network**: Generic network events
- **API**: Custom application logs

### Data Normalization

- 7 specialized normalizers for different log sources
- Automatic detection of source type
- Conversion to unified event schema
- Syslog priority parsing with RFC 3164 support
- Severity mapping (0-10 scale)

### Data Enrichment

- **GeoIP Lookup**: Country, region, city, timezone, coordinates
- **Reverse DNS**: Hostname resolution for IP addresses
- Configurable enrichment pipeline
- Non-blocking enrichment to avoid delays

### Alerting System

- Real-time rule evaluation on event ingestion
- Multiple alert types:
  - **Threshold Alerts**: Trigger when event count exceeds limit
  - **Pattern Alerts**: Match specific field values
  - **Sequence Alerts**: Detect event sequences
- Alert cooldown to prevent alert storms
- Discord webhook integration for notifications
- Alert lifecycle management (Open → Acknowledged → Resolved → Closed)
- Alert notes and resolution tracking

### Data Retention

- Per-tenant retention policies
- Automatic cleanup based on event age
- Scheduled retention jobs
- Manual cleanup trigger
- Retention statistics and reporting

## Project Structure

```
Backend/
├── src/
│   ├── app.js                # Application entry point
│   ├── config/
│   │   └── database.js       # Database configuration
│   ├── controllers/          # Route handlers
│   │   ├── health.controller.js
│   │   ├── auth.controller.js
│   │   ├── events.controller.js
│   │   ├── alerts.controller.js
│   │   ├── ingest.controller.js
│   │   ├── tenant.controller.js
│   │   └── retention.controller.js
│   ├── middleware/           # Express middleware
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── validation.middleware.js # Request validation
│   │   └── error.middleware.js      # Error handling
│   ├── models/               # Sequelize models
│   │   ├── tenant.model.js
│   │   ├── user.model.js
│   │   ├── event.model.js
│   │   ├── alert-rule.model.js
│   │   ├── alert.model.js
│   │   └── retention.model.js
│   ├── routes/               # API routes
│   │   ├── health.routes.js
│   │   ├── auth.routes.js
│   │   ├── events.routes.js
│   │   ├── alerts.routes.js
│   │   ├── ingest.routes.js
│   │   ├── tenant.routes.js
│   │   └── retention.routes.js
│   ├── services/             # Business logic
│   │   ├── auth.service.js
│   │   ├── events.service.js
│   │   ├── alerting.service.js
│   │   ├── ingest.service.js
│   │   ├── tenant.service.js
│   │   ├── retention.service.js
│   │   ├── scheduler.service.js
│   │   ├── syslog.service.js
│   │   └── discord.service.js
│   ├── normalizers/          # Log normalizers
│   │   ├── base.normalizer.js
│   │   ├── firewall.normalizer.js
│   │   ├── crowdstrike.normalizer.js
│   │   ├── aws.normalizer.js
│   │   ├── m365.normalizer.js
│   │   ├── ad.normalizer.js
│   │   ├── network.normalizer.js
│   │   └── api.normalizer.js
│   ├── enrichers/            # Data enrichers
│   │   ├── geoip.enricher.js
│   │   └── dns.enricher.js
│   ├── docs/                 # API documentation
│   └── utils/                # Utility functions
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── Dockerfile                # Docker configuration
└── package.json              # Dependencies and scripts
```

## API Endpoints

### Health

- `GET /api/health` - Server health check with database status

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and receive JWT token

### Events

- `GET /api/events` - Query events with filters and pagination
- `GET /api/events/stats` - Get event statistics
- `GET /api/events/:id` - Get single event
- `DELETE /api/events/:id` - Delete event (admin only)
- `DELETE /api/events` - Bulk delete events (admin only)

Query filters: `source`, `severity`, `src_ip`, `dst_ip`, `user`, `host`, `action`, `startTime`, `endTime`, `search`, `tags`

### Alerts

- `GET /api/alerts` - List alerts with pagination
- `GET /api/alerts/:id` - Get single alert
- `PATCH /api/alerts/:id/status` - Update alert status

### Alert Rules

- `GET /api/alerts/rules` - List all rules
- `POST /api/alerts/rules` - Create rule (admin only)
- `POST /api/alerts/rules/defaults` - Create default rules (admin only)
- `GET /api/alerts/rules/:id` - Get single rule
- `PUT /api/alerts/rules/:id` - Update rule (admin only)
- `DELETE /api/alerts/rules/:id` - Delete rule (admin only)

### Ingestion

- `POST /api/ingest` - Ingest single event (admin only)
- `POST /api/ingest/batch` - Batch ingest events (admin only)
- `POST /api/ingest/file` - Upload file (admin only)

### Tenants

- `POST /api/tenants` - Create tenant (admin only)
- `GET /api/tenants` - List tenants
- `GET /api/tenants/:id` - Get single tenant
- `PUT /api/tenants/:id` - Update tenant (admin only)
- `DELETE /api/tenants/:id` - Delete tenant (admin only)

### Retention

- `GET /api/retention/policy` - Get retention policy
- `PUT /api/retention/policy` - Create/update policy (admin only)
- `PATCH /api/retention/policy` - Partial update (admin only)
- `DELETE /api/retention/policy` - Delete policy (admin only)
- `GET /api/retention/stats` - Get retention statistics
- `POST /api/retention/cleanup` - Trigger manual cleanup (admin only)

## Getting Started

### Prerequisites

- Node.js 20+ or Bun 1.0+
- PostgreSQL 14+
- Required ports: 3000 (API), 514 (Syslog UDP/TCP)

### Installation

```bash
# Install dependencies
npm install
# or
bun install
```

### Configuration

Create a `.env` file in the Backend directory:

```bash
# Database
DATABASE=cyber
DB_USER=cyber
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h

# Server
PORT=3000
LOG_LEVEL=info

# Syslog
SYSLOG_ENABLED=true
SYSLOG_PORT=514
SYSLOG_TENANT=default

# Enrichment
ENRICHMENT_ENABLED=true
ENRICHMENT_DNS=true
ENRICHMENT_GEOIP=true

# Retention
RETENTION_ENABLED=true
RETENTION_DEFAULT_DAYS=30
```

### Database Setup

```bash
# Create database
createdb cyber

# Database will be initialized automatically on first run
# Tables and indexes are created via Sequelize sync
```

### Development

```bash
# Start development server with auto-reload
npm run dev
# or
bun run dev
```

The API will be available at http://localhost:3000

### Production

```bash
# Start production server
npm start
# or
bun start
```

## Testing

```bash
# Run all tests
npm test
# or
bun test

# Run unit tests only
npm run test:unit
# or
bun run test:unit

# Run integration tests
npm run test:integration
# or
bun run test:integration

# Run with coverage
npm run test:coverage
# or
bun run test:coverage

# Watch mode
npm run test:watch
# or
bun run test:watch
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t cyber-backend .
```

### Run Container

```bash
docker run -p 3000:3000 -p 514:514/udp -p 514:514/tcp \
  -e DATABASE=cyber \
  -e DB_HOST=postgres \
  -e DB_PASSWORD=secure-password \
  -e JWT_SECRET=your-jwt-secret \
  cyber-backend
```

## Central Event Schema

All events are normalized to this unified schema:

| Field           | Type           | Description                                        |
| --------------- | -------------- | -------------------------------------------------- |
| `id`            | UUID           | Primary key                                        |
| `tenant_id`     | String         | Tenant identifier                                  |
| `event_time`    | Timestamp      | When event occurred                                |
| `source`        | Enum           | firewall, crowdstrike, aws, m365, ad, api, network |
| `vendor`        | String         | Vendor name                                        |
| `product`       | String         | Product name                                       |
| `event_type`    | String         | Event category                                     |
| `event_subtype` | String         | Event subcategory                                  |
| `severity`      | Integer (0-10) | Event severity                                     |
| `action`        | Enum           | allow, deny, create, delete, login, logout, alert  |
| `src_ip`        | String         | Source IP address                                  |
| `dst_ip`        | String         | Destination IP address                             |
| `src_port`      | Integer        | Source port                                        |
| `dst_port`      | Integer        | Destination port                                   |
| `protocol`      | String         | Network protocol                                   |
| `user`          | String         | Username                                           |
| `host`          | String         | Hostname                                           |
| `process`       | String         | Process name                                       |
| `url`           | String         | URL (if applicable)                                |
| `cloud_*`       | String         | Cloud metadata (account, region, service)          |
| `*_geo_*`       | String/Float   | GeoIP enrichment data                              |
| `raw`           | JSONB          | Original log message                               |
| `_tags`         | Array          | Searchable tags                                    |

## Environment Variables

| Variable                 | Default       | Description                              |
| ------------------------ | ------------- | ---------------------------------------- |
| `DATABASE`               | cyber         | PostgreSQL database name                 |
| `DB_USER`                | cyber         | Database username                        |
| `DB_PASSWORD`            | cyberpassword | Database password                        |
| `DB_HOST`                | localhost     | Database host                            |
| `DB_PORT`                | 5432          | Database port                            |
| `JWT_SECRET`             | (required)    | JWT signing secret (min 32 chars)        |
| `JWT_EXPIRES_IN`         | 24h           | Token expiration time                    |
| `PORT`                   | 3000          | API server port                          |
| `LOG_LEVEL`              | info          | Logging level (debug, info, warn, error) |
| `SYSLOG_ENABLED`         | true          | Enable syslog listener                   |
| `SYSLOG_PORT`            | 514           | Syslog port                              |
| `SYSLOG_TENANT`          | default       | Default tenant for syslog events         |
| `ENRICHMENT_ENABLED`     | true          | Enable enrichment pipeline               |
| `ENRICHMENT_DNS`         | true          | Enable DNS lookups                       |
| `ENRICHMENT_GEOIP`       | true          | Enable GeoIP lookups                     |
| `RETENTION_ENABLED`      | true          | Enable automatic retention               |
| `RETENTION_DEFAULT_DAYS` | 30            | Default retention period                 |

## API Documentation

Once the server is running, interactive API documentation is available at:

**Swagger UI**: http://localhost:3000/api/docs

## Security

### Authentication

- JWT tokens with configurable expiration
- Secure password hashing with bcrypt (12 salt rounds)
- Token verification on all protected routes

### Authorization

- Role-based access control (Admin, Viewer)
- Admin-only routes for sensitive operations
- Tenant isolation enforced at middleware level

### Input Validation

- Joi schema validation on all inputs
- File upload size limits (10MB)
- Batch size limits (1000 events)
- SQL injection prevention via Sequelize

### Best Practices

- HTTPS required for production
- CORS configuration
- Rate limiting recommended
- Regular security updates
- Secure environment variable management

## Performance Optimization

### Database Indexes

```sql
-- Primary performance indexes
CREATE INDEX idx_events_tenant_id ON events(tenant_id);
CREATE INDEX idx_events_event_time ON events(event_time);
CREATE INDEX idx_events_source ON events(source);
CREATE INDEX idx_events_severity ON events(severity);

-- Composite index for common query pattern
CREATE INDEX idx_events_tenant_time ON events(tenant_id, event_time DESC);

-- GIN index for array searches
CREATE INDEX idx_events_tags ON events USING GIN(_tags);
```

### Scaling Considerations

- Connection pooling configured via Sequelize
- Async/await for non-blocking operations
- Batch processing for large ingestion
- Scheduled jobs for retention cleanup

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U cyber -d cyber -h localhost

# Check if database exists
psql -U postgres -c "\l"
```

### Syslog Not Receiving

```bash
# Check if port is available
sudo netstat -tuln | grep 514

# Test UDP syslog
echo "<134>Test message" | nc -u -w1 localhost 514

# Test TCP syslog
echo "<134>Test message" | nc localhost 514
```

### Permission Denied on Port 514

Port 514 requires elevated privileges. Options:

1. Run with sudo (not recommended for production)
2. Use port forwarding: `sudo iptables -t nat -A PREROUTING -p udp --dport 514 -j REDIRECT --to-port 5140`
3. Use a different port and configure syslog clients accordingly

## Contributing

1. Follow the existing code style
2. Write unit tests for new features
3. Update API documentation
4. Keep services small and focused
5. Use async/await for asynchronous operations
6. Add proper error handling

## License

See the main project README for license information.
