## GitHub Actions CI/CD

### Workflow Overview

The `.github/workflows/build.yml` workflow runs on:

- **Pull Requests**: Build and test only
- **Push to main**: Build, test, and deploy

### Required GitHub Secrets

Configure these secrets in your repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name              | Description                                                                 | Example                     |
| ------------------------ | --------------------------------------------------------------------------- | --------------------------- |
| `DATABASE`               | PostgreSQL database name                                                    | `cyber`                     |
| `DB_USER`                | PostgreSQL username                                                         | `cyber`                     |
| `DB_PASSWORD`            | PostgreSQL password                                                         | `secure-password-here`      |
| `JWT_SECRET`             | JWT signing key (min 32 chars)                                              | `your-super-secret-jwt-key` |
| `JWT_EXPIRES_IN`         | JWT expiration time                                                         | `24h`                       |
| `LOG_LEVEL`              | Logging level                                                               | `info`                      |
| `SYSLOG_ENABLED`         | Enable syslog server                                                        | `true`                      |
| `SYSLOG_TENANT`          | Default tenant for syslog                                                   | `default`                   |
| `ENRICHMENT_ENABLED`     | Enable log enrichment                                                       | `true`                      |
| `ENRICHMENT_DNS`         | Enable DNS enrichment                                                       | `true`                      |
| `ENRICHMENT_GEOIP`       | Enable GeoIP enrichment                                                     | `true`                      |
| `RETENTION_ENABLED`      | Enable data retention                                                       | `true`                      |
| `RETENTION_DEFAULT_DAYS` | Default retention period                                                    | `30`                        |
| `NGINX_NETWORK`          | _(Optional)_ Set to any value to enable production mode with external nginx | `nginxNetwork`              |
| `NGINX_CONTAINER_NAME`   | _(Optional)_ Name of nginx container to restart after deployment            | `nginx`                     |

**Notes:**

- Set `NGINX_NETWORK` secret if you have an external nginx reverse proxy. This enables production deployment mode using `docker-compose.prod.yml`.
- Set `NGINX_CONTAINER_NAME` to your nginx container name. If not set, the workflow will auto-detect common nginx containers.
- After deploying new frontend/backend images, the nginx container will be restarted to reload configuration.
