# Architecture Overview

## System Diagram

```
                                    +------------------+
                                    |    Frontend      |
                                    |   (React + TS)   |
                                    |   Port: 80/443   |
                                    +--------+---------+
                                             |
                                             | HTTP/HTTPS
                                             v
+------------------+              +------------------+              +------------------+
|   Syslog Input   |              |    Backend API   |              |   PostgreSQL     |
| (UDP/TCP 514)    +------------->|   (Express.js)   |<------------>|   Database       |
|                  |   Syslog     |   Port: 3000     |    SQL       |   Port: 5432     |
+------------------+              +--------+---------+              +------------------+
                                           ^
                                           |
+------------------+                       |
|   HTTP Clients   |-----------------------+
| (API/File/Batch) |      REST API
+------------------+
```

## Data Flow

### 1. Log Ingestion

```
[Log Source] --> [Ingestion] --> [Normalization] --> [Enrichment] --> [Storage] --> [Alerting]
```

1. **Ingestion Layer**
   - Syslog Server (UDP/TCP port 514)
   - HTTP API (`POST /api/ingest`)
   - Batch Upload (`POST /api/ingest/batch`)
   - File Upload (`POST /api/ingest/file`)

2. **Normalization Layer**
   - 7 specialized normalizers (Firewall, Network, API, CrowdStrike, AWS, M365, AD)
   - Auto-detection of source type
   - Conversion to central Event schema

3. **Enrichment Layer** (Optional)
   - Reverse DNS lookup for IP addresses
   - GeoIP lookup (country, city, coordinates)

4. **Storage Layer**
   - PostgreSQL with optimized indexing
   - GIN index for tag-based filtering
   - Composite indexes for tenant + time queries

5. **Alerting Layer**
   - Real-time rule evaluation
   - Threshold, pattern, and sequence rules
   - Discord webhook notifications

### 2. Query Flow

```
[UI/API Request] --> [Auth Middleware] --> [Tenant Isolation] --> [Query Service] --> [Response]
```

## Multi-Tenant Architecture

### Tenant Isolation Model

- **Tenant ID**: Every event, alert, and rule is scoped to a `tenant_id`
- **Middleware Enforcement**: All queries automatically filtered by authenticated user's tenant
- **RBAC**: Two roles (Admin, Viewer) with different permissions

```
┌─────────────────────────────────────────────────────────────────┐
│                         Request Flow                             │
├─────────────────────────────────────────────────────────────────┤
│  Client Request                                                  │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐                                                 │
│  │ JWT Verify  │ ──── Invalid ──── 401 Unauthorized             │
│  └─────────────┘                                                 │
│       │ Valid                                                    │
│       ▼                                                          │
│  ┌─────────────┐                                                 │
│  │ Role Check  │ ──── Forbidden ── 403 Forbidden                │
│  └─────────────┘                                                 │
│       │ Allowed                                                  │
│       ▼                                                          │
│  ┌─────────────┐                                                 │
│  │ Tenant      │ ──── Injects tenant_id from JWT                │
│  │ Isolation   │      into all database queries                  │
│  └─────────────┘                                                 │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐                                                 │
│  │ Business    │                                                 │
│  │ Logic       │                                                 │
│  └─────────────┘                                                 │
│       │                                                          │
│       ▼                                                          │
│  Response                                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Central Event Schema

All logs are normalized to this unified schema:

| Field                   | Type           | Description                                        |
| ----------------------- | -------------- | -------------------------------------------------- |
| `id`                    | UUID           | Primary key                                        |
| `tenant_id`             | String         | Tenant identifier                                  |
| `event_time`            | Timestamp      | When event occurred                                |
| `source`                | Enum           | firewall, crowdstrike, aws, m365, ad, api, network |
| `vendor`                | String         | Vendor name                                        |
| `product`               | String         | Product name                                       |
| `event_type`            | String         | Event category                                     |
| `event_subtype`         | String         | Event subcategory                                  |
| `severity`              | Integer (0-10) | Event severity                                     |
| `action`                | Enum           | allow, deny, create, delete, login, logout, alert  |
| `src_ip` / `dst_ip`     | String         | Source/Destination IP                              |
| `src_port` / `dst_port` | Integer        | Source/Destination port                            |
| `protocol`              | String         | Network protocol                                   |
| `user`                  | String         | Username                                           |
| `host`                  | String         | Hostname                                           |
| `process`               | String         | Process name                                       |
| `url`                   | String         | URL (if applicable)                                |
| `cloud_*`               | String         | Cloud metadata (account, region, service)          |
| `*_geo_*`               | String/Float   | GeoIP enrichment data                              |
| `raw`                   | JSONB          | Original log message                               |
| `_tags`                 | Array          | Searchable tags                                    |

## Database Indexing Strategy

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

## Component Details

### Backend Services

| Service          | Responsibility                         |
| ---------------- | -------------------------------------- |
| AuthService      | JWT token management, password hashing |
| EventService     | Event CRUD, query building, stats      |
| AlertService     | Rule evaluation, alert lifecycle       |
| IngestService    | Log parsing, normalization, enrichment |
| RetentionService | Data cleanup, policy management        |
| SyslogService    | UDP/TCP syslog receiver                |

### Frontend Pages

| Page        | Features                                                        |
| ----------- | --------------------------------------------------------------- |
| Dashboard   | Stats cards, charts (source, severity, timeline, top IPs/users) |
| Events      | Filterable table, pagination, sorting, event detail modal       |
| Alerts      | Alert cards, status management, resolution notes                |
| Alert Rules | Rule CRUD, conditions builder, default rules                    |
| Tenants     | Tenant management (admin only)                                  |
| Settings    | User info, retention policy, logout                             |

## Security Considerations

1. **Authentication**: JWT tokens with configurable expiration
2. **Password Storage**: bcrypt with 12 salt rounds
3. **Tenant Isolation**: Enforced at middleware level
4. **Input Validation**: Joi schema validation on all endpoints
5. **HTTPS**: Required for production (configured via nginx)
6. **Rate Limiting**: Recommended for production deployment
