import { BaseNormalizer } from "./base.normalizer.js";

export class ApiNormalizer extends BaseNormalizer {
  constructor() {
    super("api");
  }

  normalize(data, tenantId) {
    const tags = [];

    let action = null;
    let severity = data.severity || 3;

    const eventType = (data.event_type || "").toLowerCase();

    if (eventType.includes("login_failed") || eventType.includes("failed")) {
      action = "deny";
      severity = Math.max(severity, 4);
      tags.push("auth-failure");
    } else if (eventType.includes("login_success") || eventType.includes("login")) {
      action = "login";
      tags.push("auth-success");
    } else if (eventType.includes("logout")) {
      action = "logout";
    } else if (eventType.includes("created") || eventType.includes("create")) {
      action = "create";
    } else if (eventType.includes("deleted") || eventType.includes("delete")) {
      action = "delete";
    }

    if (eventType.includes("permission") || eventType.includes("role")) {
      tags.push("privilege-change");
      severity = Math.max(severity, 5);
    }

    if (eventType.includes("api_key")) {
      tags.push("api-key");
      severity = Math.max(severity, 5);
    }

    if (eventType.includes("password")) {
      tags.push("password-change");
      severity = Math.max(severity, 4);
    }

    if (eventType.includes("download") || eventType.includes("file")) {
      tags.push("file-access");
    }

    const result = {
      ...this.baseEvent(data, tenantId),
      event_type: data.event_type,
      event_subtype: data.event_subtype,
      severity,
      action,
      src_ip: data.src_ip || data.ip,
      user: data.user,
      host: data.host,
      url: data.url || data.file,
      http_method: data.http_method || data.method,
      status_code: data.status_code,
    };

    if (data.reason) {
      tags.push(`reason:${data.reason}`);
    }

    if (data.target_user) {
      tags.push(`target:${data.target_user}`);
    }

    result._tags = this.generateTags(result, tags);
    return result;
  }
}
