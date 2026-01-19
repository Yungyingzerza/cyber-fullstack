import { BaseNormalizer } from "./base.normalizer.js";

export class CrowdStrikeNormalizer extends BaseNormalizer {
  constructor() {
    super("crowdstrike");
  }

  normalize(data, tenantId) {
    const tags = [];
    const eventType = (data.event_type || "").toLowerCase();

    let action = this.mapAction(data.action);
    let severity = data.severity || 5;

    if (eventType.includes("malware")) {
      tags.push("malware");
      severity = Math.max(severity, 7);
    }

    if (eventType.includes("ransomware")) {
      tags.push("ransomware");
      tags.push("critical-threat");
      severity = Math.max(severity, 9);
    }

    if (eventType.includes("credential") || eventType.includes("mimikatz")) {
      tags.push("credential-theft");
      severity = Math.max(severity, 8);
    }

    if (eventType.includes("injection") || eventType.includes("process_injection")) {
      tags.push("process-injection");
      severity = Math.max(severity, 8);
    }

    if (eventType.includes("lateral")) {
      tags.push("lateral-movement");
      severity = Math.max(severity, 7);
    }

    if (eventType.includes("c2") || eventType.includes("command_and_control") ||
        data.category === "command_and_control") {
      tags.push("c2");
      severity = Math.max(severity, 8);
    }

    if (eventType.includes("suspicious")) {
      tags.push("suspicious");
    }

    if (data.technique) {
      tags.push(`mitre:${data.technique}`);
    }

    if (data.sha256) {
      tags.push("has-hash");
    }

    if (data.action === "quarantine" || data.action === "kill_process" || data.action === "blocked") {
      tags.push("prevented");
      action = "deny";
    } else if (data.action === "alert") {
      tags.push("detection-only");
      action = "alert";
    }

    const result = {
      ...this.baseEvent(data, tenantId),
      event_type: data.event_type,
      severity,
      action,
      dst_ip: data.dst_ip,
      dst_port: data.dst_port,
      user: data.user,
      host: data.host,
      process: data.process,
      url: data.domain,
    };

    if (data.parent_process) {
      tags.push(`parent:${data.parent_process}`);
    }

    if (data.command_line) {
      tags.push("has-cmdline");
    }

    if (data.files_affected && data.files_affected > 0) {
      tags.push("file-modification");
      if (data.files_affected > 100) {
        tags.push("mass-file-operation");
      }
    }

    result._tags = this.generateTags(result, tags);
    return result;
  }
}
