import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Cyber Security Log Platform API',
    version: '1.0.0',
    description: `
Multi-tenant security log ingestion and analysis platform API.

## Overview
This API provides endpoints for:
- **Authentication**: User registration and login with JWT tokens
- **Event Ingestion**: Single event, batch, and file upload ingestion
- **Event Query**: Search, filter, and retrieve security events
- **Alerting**: Create and manage alert rules, view triggered alerts
- **Data Retention**: Configure retention policies per tenant

## Authentication
All protected endpoints require a JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

## Multi-tenancy
All data is isolated by tenant. The tenant_id is extracted from the JWT token.

## Roles
- **admin**: Full access to all endpoints
- **viewer**: Read-only access to events and alerts
    `,
    contact: {
      name: 'API Support',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Authentication', description: 'User registration and login' },
    { name: 'Tenants', description: 'Tenant management (Admin only)' },
    { name: 'Ingestion', description: 'Event ingestion endpoints' },
    { name: 'Events', description: 'Event query and management' },
    { name: 'Alerts', description: 'Alert rules and triggered alerts' },
    { name: 'Retention', description: 'Data retention policy management' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /auth/login or /auth/register',
      },
    },
    schemas: {
      // ==================== Common Schemas ====================
      Error: {
        type: 'object',
        properties: {
          error: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  details: {
                    type: 'array',
                    items: { type: 'object' },
                  },
                },
              },
            ],
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                path: { type: 'array', items: { type: 'string' } },
                type: { type: 'string' },
              },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 50 },
          total: { type: 'integer', example: 100 },
          total_pages: { type: 'integer', example: 2 },
          has_next: { type: 'boolean', example: true },
          has_prev: { type: 'boolean', example: false },
        },
      },

      // ==================== Auth Schemas ====================
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'tenant_id'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'securepassword123',
          },
          role: {
            type: 'string',
            enum: ['admin', 'viewer'],
            default: 'viewer',
            example: 'viewer',
          },
          tenant_id: {
            type: 'string',
            description: 'Tenant name (must exist in the system)',
            example: 'acme-corp',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            example: 'securepassword123',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'viewer'] },
          tenant_id: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Login successful' },
          user: { $ref: '#/components/schemas/User' },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },

      // ==================== Tenant Schemas ====================
      TenantInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'acme-corp',
          },
          description: {
            type: 'string',
            maxLength: 500,
            example: 'ACME Corporation tenant',
          },
          is_active: {
            type: 'boolean',
            default: true,
          },
        },
      },
      Tenant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'acme-corp' },
          description: { type: 'string', example: 'ACME Corporation tenant' },
          is_active: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },

      // ==================== Event Schemas ====================
      EventSource: {
        type: 'string',
        enum: ['firewall', 'crowdstrike', 'aws', 'm365', 'ad', 'api', 'network'],
      },
      EventAction: {
        type: 'string',
        enum: ['allow', 'deny', 'create', 'delete', 'login', 'logout', 'alert'],
      },
      CloudMetadata: {
        type: 'object',
        properties: {
          account_id: { type: 'string' },
          region: { type: 'string' },
          service: { type: 'string' },
        },
      },
      EventInput: {
        type: 'object',
        required: ['source'],
        properties: {
          '@timestamp': {
            type: 'string',
            format: 'date-time',
            description: 'Event timestamp (ISO8601)',
          },
          event_time: {
            type: 'string',
            format: 'date-time',
            description: 'Alternative timestamp field',
          },
          source: { $ref: '#/components/schemas/EventSource' },
          vendor: { type: 'string', example: 'Palo Alto' },
          product: { type: 'string', example: 'PA-5250' },
          event_type: { type: 'string', example: 'TRAFFIC' },
          event_subtype: { type: 'string', example: 'end' },
          event_id: { type: 'integer' },
          severity: {
            type: 'integer',
            minimum: 0,
            maximum: 10,
            example: 5,
          },
          action: { $ref: '#/components/schemas/EventAction' },
          src_ip: { type: 'string', format: 'ipv4', example: '192.168.1.100' },
          src_port: { type: 'integer', minimum: 0, maximum: 65535 },
          dst_ip: { type: 'string', format: 'ipv4', example: '10.0.0.1' },
          dst_port: { type: 'integer', minimum: 0, maximum: 65535 },
          protocol: { type: 'string', example: 'TCP' },
          user: { type: 'string', example: 'john.doe' },
          host: { type: 'string', example: 'workstation-01' },
          process: { type: 'string', example: 'chrome.exe' },
          url: { type: 'string', format: 'uri' },
          http_method: { type: 'string', example: 'GET' },
          status_code: { type: 'integer', example: 200 },
          status: { type: 'string' },
          rule_name: { type: 'string' },
          rule_id: { type: 'string' },
          cloud: { $ref: '#/components/schemas/CloudMetadata' },
          _tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['critical', 'reviewed'],
          },
          raw: {
            description: 'Original log message (always preserved)',
            example: '<14>Jan 15 10:30:00 firewall1 TRAFFIC...',
          },
        },
        additionalProperties: true,
      },
      Event: {
        allOf: [
          { $ref: '#/components/schemas/EventInput' },
          {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              tenant_id: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      EventListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Event' },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      IngestResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Event ingested successfully' },
          event_id: { type: 'string', format: 'uuid' },
        },
      },
      BatchIngestResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Events ingested successfully' },
          count: { type: 'integer', example: 10 },
          event_ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
        },
      },

      // ==================== Alert Schemas ====================
      RuleCondition: {
        type: 'object',
        required: ['field', 'operator'],
        properties: {
          field: {
            type: 'string',
            example: 'action',
            description: 'Event field to match',
          },
          operator: {
            type: 'string',
            enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'regex', 'exists', 'not_exists'],
            example: 'eq',
          },
          value: {
            description: 'Value to compare against',
            example: 'deny',
          },
        },
      },
      AlertRuleInput: {
        type: 'object',
        required: ['name', 'conditions'],
        properties: {
          name: {
            type: 'string',
            maxLength: 100,
            example: 'Failed Login Detection',
          },
          description: {
            type: 'string',
            maxLength: 500,
            example: 'Detect multiple failed login attempts',
          },
          enabled: { type: 'boolean', default: true },
          rule_type: {
            type: 'string',
            enum: ['threshold', 'pattern', 'sequence'],
            default: 'threshold',
          },
          conditions: {
            oneOf: [
              { $ref: '#/components/schemas/RuleCondition' },
              {
                type: 'array',
                items: { $ref: '#/components/schemas/RuleCondition' },
              },
            ],
          },
          threshold_count: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            default: 1,
            example: 5,
          },
          threshold_window_seconds: {
            type: 'integer',
            minimum: 60,
            maximum: 86400,
            default: 300,
            example: 300,
            description: 'Time window in seconds',
          },
          group_by: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            example: ['src_ip'],
          },
          alert_severity: {
            type: 'integer',
            minimum: 0,
            maximum: 10,
            default: 5,
          },
          notify_discord: { type: 'boolean', default: false },
          discord_webhook_url: {
            type: 'string',
            format: 'uri',
            nullable: true,
          },
          cooldown_seconds: {
            type: 'integer',
            minimum: 0,
            maximum: 86400,
            default: 300,
          },
        },
      },
      AlertRule: {
        allOf: [
          { $ref: '#/components/schemas/AlertRuleInput' },
          {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              tenant_id: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      AlertStatus: {
        type: 'string',
        enum: ['open', 'acknowledged', 'resolved', 'closed'],
      },
      Alert: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tenant_id: { type: 'string', format: 'uuid' },
          rule_id: { type: 'string', format: 'uuid' },
          status: { $ref: '#/components/schemas/AlertStatus' },
          severity: { type: 'integer', minimum: 0, maximum: 10 },
          message: { type: 'string' },
          triggered_events: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
          acknowledged_by: { type: 'string', nullable: true },
          acknowledged_at: { type: 'string', format: 'date-time', nullable: true },
          resolved_at: { type: 'string', format: 'date-time', nullable: true },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AlertListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Alert' },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      UpdateAlertStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { $ref: '#/components/schemas/AlertStatus' },
          notes: { type: 'string', maxLength: 1000 },
        },
      },

      // ==================== Retention Schemas ====================
      RetentionPolicy: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tenant_id: { type: 'string', format: 'uuid' },
          retention_days: {
            type: 'integer',
            minimum: 7,
            maximum: 3650,
            default: 30,
          },
          archive_enabled: { type: 'boolean', default: false },
          archive_destination: { type: 'string', maxLength: 500 },
          source_overrides: {
            type: 'object',
            additionalProperties: { type: 'integer', minimum: 7, maximum: 3650 },
            example: { firewall: 14, crowdstrike: 90 },
          },
          severity_overrides: {
            type: 'object',
            additionalProperties: { type: 'integer', minimum: 7, maximum: 3650 },
            example: { '9': 365, '10': 365 },
          },
          enabled: { type: 'boolean', default: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RetentionPolicyInput: {
        type: 'object',
        properties: {
          retention_days: {
            type: 'integer',
            minimum: 7,
            maximum: 3650,
            default: 30,
          },
          archive_enabled: { type: 'boolean', default: false },
          archive_destination: { type: 'string', maxLength: 500 },
          source_overrides: {
            type: 'object',
            additionalProperties: { type: 'integer', minimum: 7, maximum: 3650 },
          },
          severity_overrides: {
            type: 'object',
            additionalProperties: { type: 'integer', minimum: 7, maximum: 3650 },
          },
          enabled: { type: 'boolean', default: true },
        },
      },

      // ==================== Health Schemas ====================
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ok', 'degraded'],
          },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number', description: 'Uptime in seconds' },
          checks: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['ok', 'error'] },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Unauthorized: {
        description: 'Missing or invalid authentication token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Authentication required' },
          },
        },
      },
      Forbidden: {
        description: 'Insufficient permissions or tenant mismatch',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Admin role required' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { error: 'Resource not found' },
          },
        },
      },
    },
  },
  paths: {
    // ==================== Health ====================
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check API and database health status',
        responses: {
          200: {
            description: 'Service healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
          503: {
            description: 'Service degraded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },

    // ==================== Authentication ====================
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Create a new user account and receive a JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          409: {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login',
        description: 'Authenticate with email and password to receive a JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Invalid email or password' },
              },
            },
          },
        },
      },
    },

    // ==================== Tenants ====================
    '/tenants': {
      get: {
        tags: ['Tenants'],
        summary: 'List all tenants',
        description: 'Get all tenants (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'includeInactive',
            in: 'query',
            schema: { type: 'boolean', default: false },
            description: 'Include inactive tenants',
          },
        ],
        responses: {
          200: {
            description: 'Tenants retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tenants: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Tenant' },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Tenants'],
        summary: 'Create tenant',
        description: 'Create a new tenant (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TenantInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Tenant created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    tenant: { $ref: '#/components/schemas/Tenant' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: {
            description: 'Tenant name already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/tenants/{id}': {
      get: {
        tags: ['Tenants'],
        summary: 'Get tenant by ID',
        description: 'Get a single tenant by ID (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Tenant retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tenant: { $ref: '#/components/schemas/Tenant' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Tenants'],
        summary: 'Update tenant',
        description: 'Update a tenant (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TenantInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Tenant updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    tenant: { $ref: '#/components/schemas/Tenant' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          409: {
            description: 'Tenant name already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Tenants'],
        summary: 'Delete tenant',
        description: 'Delete a tenant (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Tenant deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ==================== Ingestion ====================
    '/ingest': {
      post: {
        tags: ['Ingestion'],
        summary: 'Ingest a single event',
        description: 'Ingest a single security event. The event will be normalized and enriched automatically.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EventInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Event ingested successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/IngestResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/ingest/batch': {
      post: {
        tags: ['Ingestion'],
        summary: 'Ingest multiple events',
        description: 'Ingest a batch of security events (1-1000 events per request)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/EventInput' },
                minItems: 1,
                maxItems: 1000,
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Events ingested successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BatchIngestResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/ingest/file': {
      post: {
        tags: ['Ingestion'],
        summary: 'Upload log file',
        description: 'Upload a log file (JSON, text, or CSV) for ingestion. Max 10MB, 1000 events.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Log file (JSON, text, or CSV)',
                  },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'File processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    filename: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          413: {
            description: 'File too large (max 10MB)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    // ==================== Events ====================
    '/events': {
      get: {
        tags: ['Events'],
        summary: 'Query events',
        description: 'Search and filter security events with pagination',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'source',
            in: 'query',
            schema: { $ref: '#/components/schemas/EventSource' },
          },
          {
            name: 'sources',
            in: 'query',
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/EventSource' },
            },
            style: 'form',
            explode: true,
            description: 'Multiple sources',
          },
          {
            name: 'severity',
            in: 'query',
            schema: { type: 'integer', minimum: 0, maximum: 10 },
          },
          {
            name: 'severity_min',
            in: 'query',
            schema: { type: 'integer', minimum: 0, maximum: 10 },
          },
          {
            name: 'severity_max',
            in: 'query',
            schema: { type: 'integer', minimum: 0, maximum: 10 },
          },
          {
            name: 'action',
            in: 'query',
            schema: { $ref: '#/components/schemas/EventAction' },
          },
          {
            name: 'actions',
            in: 'query',
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/EventAction' },
            },
            style: 'form',
            explode: true,
          },
          {
            name: 'start_time',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'end_time',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'src_ip',
            in: 'query',
            schema: { type: 'string' },
            description: 'Supports wildcards (*)',
          },
          {
            name: 'dst_ip',
            in: 'query',
            schema: { type: 'string' },
            description: 'Supports wildcards (*)',
          },
          {
            name: 'user',
            in: 'query',
            schema: { type: 'string', maxLength: 100 },
          },
          {
            name: 'host',
            in: 'query',
            schema: { type: 'string', maxLength: 100 },
          },
          {
            name: 'event_type',
            in: 'query',
            schema: { type: 'string', maxLength: 100 },
          },
          {
            name: 'tags',
            in: 'query',
            schema: { type: 'array', items: { type: 'string' } },
            style: 'form',
            explode: true,
            description: 'Filter by tags (uses GIN index)',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string', maxLength: 500 },
            description: 'Full-text search on raw field',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
          },
          {
            name: 'sort_by',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['event_time', 'severity', 'source', 'action', 'src_ip', 'dst_ip', 'user', 'host', 'event_type'],
              default: 'event_time',
            },
          },
          {
            name: 'sort_order',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['asc', 'ASC', 'desc', 'DESC'],
              default: 'DESC',
            },
          },
        ],
        responses: {
          200: {
            description: 'Events retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EventListResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Events'],
        summary: 'Bulk delete events',
        description: 'Delete events before a specified date (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['before'],
                properties: {
                  before: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Delete events before this timestamp',
                  },
                  source: {
                    $ref: '#/components/schemas/EventSource',
                    description: 'Optionally filter by source',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Events deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/events/stats': {
      get: {
        tags: ['Events'],
        summary: 'Get event statistics',
        description: 'Get aggregated statistics for events',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'start_time',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'end_time',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          200: {
            description: 'Statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  description: 'Aggregated event statistics',
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Get event by ID',
        description: 'Retrieve a single event by its ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Event retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Event' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Events'],
        summary: 'Delete event',
        description: 'Delete a single event by ID (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Event deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ==================== Alerts ====================
    '/alerts/rules': {
      get: {
        tags: ['Alerts'],
        summary: 'List alert rules',
        description: 'Get all alert rules for the tenant',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Rules retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AlertRule' },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Alerts'],
        summary: 'Create alert rule',
        description: 'Create a new alert rule (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AlertRuleInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Rule created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    rule: { $ref: '#/components/schemas/AlertRule' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/alerts/rules/defaults': {
      post: {
        tags: ['Alerts'],
        summary: 'Create default rules',
        description: 'Create predefined default alert rules for the tenant (Admin only)',
        security: [{ BearerAuth: [] }],
        responses: {
          201: {
            description: 'Default rules created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    count: { type: 'integer' },
                    rules: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AlertRule' },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/alerts/rules/{id}': {
      get: {
        tags: ['Alerts'],
        summary: 'Get alert rule',
        description: 'Get a single alert rule by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Rule retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AlertRule' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Alerts'],
        summary: 'Update alert rule',
        description: 'Update an existing alert rule (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AlertRuleInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Rule updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    rule: { $ref: '#/components/schemas/AlertRule' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Alerts'],
        summary: 'Delete alert rule',
        description: 'Delete an alert rule (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Rule deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/alerts': {
      get: {
        tags: ['Alerts'],
        summary: 'List triggered alerts',
        description: 'Get triggered alerts with filtering and pagination',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { $ref: '#/components/schemas/AlertStatus' },
          },
          {
            name: 'severity_min',
            in: 'query',
            schema: { type: 'integer', minimum: 0, maximum: 10 },
          },
          {
            name: 'rule_id',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
        ],
        responses: {
          200: {
            description: 'Alerts retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AlertListResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/alerts/{id}': {
      get: {
        tags: ['Alerts'],
        summary: 'Get alert by ID',
        description: 'Get a single triggered alert by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Alert retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Alert' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/alerts/{id}/status': {
      patch: {
        tags: ['Alerts'],
        summary: 'Update alert status',
        description: 'Update the status of a triggered alert',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateAlertStatusRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Alert status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    alert: { $ref: '#/components/schemas/Alert' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ==================== Retention ====================
    '/retention/policy': {
      get: {
        tags: ['Retention'],
        summary: 'Get retention policy',
        description: 'Get the retention policy for the tenant',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Policy retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/RetentionPolicy' },
                    {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                        policy: { type: 'null' },
                        default_retention_days: { type: 'integer' },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      put: {
        tags: ['Retention'],
        summary: 'Create or replace retention policy',
        description: 'Create or fully replace the retention policy (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RetentionPolicyInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Policy created/updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    policy: { $ref: '#/components/schemas/RetentionPolicy' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      patch: {
        tags: ['Retention'],
        summary: 'Update retention policy',
        description: 'Partially update the retention policy (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RetentionPolicyInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Policy updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    policy: { $ref: '#/components/schemas/RetentionPolicy' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Retention'],
        summary: 'Delete retention policy',
        description: 'Delete the custom retention policy (Admin only). Tenant will use default retention.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Policy deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/retention/stats': {
      get: {
        tags: ['Retention'],
        summary: 'Get retention statistics',
        description: 'Get retention statistics for the tenant',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  description: 'Retention statistics',
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/retention/cleanup': {
      post: {
        tags: ['Retention'],
        summary: 'Trigger cleanup job',
        description: 'Manually trigger the retention cleanup job (Admin only)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Cleanup job started',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    note: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/retention/policies': {
      get: {
        tags: ['Retention'],
        summary: 'List all policies (System Admin)',
        description: 'Get all retention policies across all tenants (Admin only)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Policies retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RetentionPolicy' },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [], // No JSDoc comments needed since we define everything inline
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  // Serve Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Cyber API Documentation',
  }));

  // Serve raw OpenAPI spec as JSON (for viewing)
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Download OpenAPI spec as JSON file (for Postman import)
  app.get('/api/docs/download', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="cyber-api-openapi.json"');
    res.send(JSON.stringify(swaggerSpec, null, 2));
  });
};

export { swaggerSpec };
