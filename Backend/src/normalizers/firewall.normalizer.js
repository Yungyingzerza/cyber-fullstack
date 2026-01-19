import { BaseNormalizer } from "./base.normalizer.js";

export class FirewallNormalizer extends BaseNormalizer {
  constructor() {
    super("firewall");
  }

  canHandle(data) {
    if (typeof data === "string") {
      return data.includes("vendor=") || data.includes("action=deny") || data.includes("action=allow");
    }
    return data.source === "firewall";
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
      source: "firewall",
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
          case "vendor":
            result.vendor = value;
            break;
          case "product":
            result.product = value;
            break;
          case "action":
            result.action = this.mapAction(value);
            if (value === "deny" || value === "block") tags.push("blocked");
            if (value === "alert") tags.push("alert");
            break;
          case "src":
            result.src_ip = value;
            break;
          case "dst":
            result.dst_ip = value;
            break;
          case "spt":
            result.src_port = parseInt(value, 10);
            break;
          case "dpt":
            result.dst_port = parseInt(value, 10);
            break;
          case "proto":
            result.protocol = value;
            tags.push(`proto:${value}`);
            break;
          case "policy":
          case "rule":
            result.rule_name = value;
            break;
          case "msg":
            result.event_type = value.replace(/\s+/g, "_");
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
      vendor: data.vendor,
      product: data.product,
      event_type: data.event_type,
      severity: data.severity,
      action: this.mapAction(data.action),
      src_ip: data.src_ip || data.src,
      src_port: data.src_port || data.spt,
      dst_ip: data.dst_ip || data.dst,
      dst_port: data.dst_port || data.dpt,
      protocol: data.protocol || data.proto,
      rule_name: data.rule_name || data.policy,
      host: data.host,
    };

    result._tags = this.generateTags(result, data._tags || []);
    return result;
  }
}
