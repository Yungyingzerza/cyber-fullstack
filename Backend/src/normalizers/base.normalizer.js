export class BaseNormalizer {
  constructor(source) {
    this.source = source;
  }

  normalize(data, tenantId) {
    throw new Error("normalize() must be implemented by subclass");
  }

  canHandle(data) {
    return data.source === this.source;
  }

  parseTimestamp(value) {
    if (!value) return new Date();
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  mapAction(action) {
    if (!action) return null;

    const actionMap = {
      quarantine: "deny",
      block: "deny",
      blocked: "deny",
      kill_process: "deny",
      success: "allow",
      failure: "deny",
      failed: "deny",
      "violation-restrict": "deny",
      drop: "deny",
    };

    const normalized = action.toLowerCase();
    const validActions = ["allow", "deny", "create", "delete", "login", "logout", "alert"];

    return actionMap[normalized] || (validActions.includes(normalized) ? normalized : null);
  }

  generateTags(data, extraTags = []) {
    const tags = [...extraTags];

    if (this.source) tags.push(`source:${this.source}`);
    if (data.event_type) tags.push(`type:${data.event_type}`);
    if (data.severity >= 7) tags.push("high-severity");
    if (data.severity >= 9) tags.push("critical");

    return [...new Set(tags)];
  }

  baseEvent(data, tenantId) {
    return {
      event_time: this.parseTimestamp(data["@timestamp"] || data.event_time),
      tenant_id: tenantId || data.tenant_id || data.tenant,
      source: this.source,
      raw: typeof data === "string" ? data : JSON.stringify(data),
    };
  }
}
