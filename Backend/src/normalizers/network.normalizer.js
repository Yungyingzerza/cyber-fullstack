import { BaseNormalizer } from "./base.normalizer.js";

export class NetworkNormalizer extends BaseNormalizer {
  constructor() {
    super("network");
  }

  canHandle(data) {
    if (typeof data === "string") {
      return data.includes("event=link") || data.includes("event=port") ||
             data.includes("event=stp") || data.includes("event=lacp") ||
             data.includes("event=vlan");
    }
    return data.source === "network";
  }

  normalize(data, tenantId) {
    if (typeof data === "string") {
      return this.parseSyslog(data, tenantId);
    }
    return this.normalizeJson(data, tenantId);
  }

  parseSyslog(message, tenantId) {
    const result = {
      ...this.baseEvent({ raw: message }, tenantId),
      source: "network",
    };

    const priMatch = message.match(/^<(\d+)>/);
    if (priMatch) {
      const pri = parseInt(priMatch[1], 10);
      result.severity = Math.min(10, Math.max(0, 10 - (pri % 8)));
      message = message.slice(priMatch[0].length);
    }

    const tsMatch = message.match(/^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+/);
    if (tsMatch) {
      const year = new Date().getFullYear();
      const parsed = new Date(`${tsMatch[1]} ${year}`);
      if (!isNaN(parsed.getTime())) {
        result.event_time = parsed;
      }
      message = message.slice(tsMatch[0].length);
    }

    const hostMatch = message.match(/^(\S+)\s+/);
    if (hostMatch) {
      result.host = hostMatch[1];
      message = message.slice(hostMatch[0].length);
    }

    const kvPairs = message.match(/(\w+)=([^\s]+)/g);
    const tags = [];

    if (kvPairs) {
      for (const pair of kvPairs) {
        const eqIndex = pair.indexOf("=");
        const key = pair.slice(0, eqIndex).toLowerCase();
        const value = pair.slice(eqIndex + 1);

        switch (key) {
          case "if":
            result.event_subtype = value;
            tags.push(`interface:${value}`);
            break;
          case "event":
            result.event_type = value;
            if (value.includes("down") || value === "link-flap") {
              result.severity = result.severity || 5;
              tags.push("outage");
            }
            if (value === "port-security" || value === "vlan-mismatch") {
              tags.push("security");
            }
            break;
          case "mac":
            tags.push(`mac:${value}`);
            break;
          case "reason":
            tags.push(`reason:${value}`);
            break;
          case "action":
            result.action = this.mapAction(value);
            break;
          case "speed":
            tags.push(`speed:${value}`);
            break;
          case "count":
            if (parseInt(value, 10) > 3) {
              result.severity = Math.max(result.severity || 0, 6);
              tags.push("flapping");
            }
            break;
        }
      }
    }

    result._tags = this.generateTags(result, tags);
    return result;
  }

  normalizeJson(data, tenantId) {
    const result = {
      ...this.baseEvent(data, tenantId),
      event_type: data.event_type || data.event,
      event_subtype: data.event_subtype || data.interface,
      severity: data.severity,
      action: this.mapAction(data.action),
      host: data.host,
    };

    result._tags = this.generateTags(result, data._tags || []);
    return result;
  }
}
