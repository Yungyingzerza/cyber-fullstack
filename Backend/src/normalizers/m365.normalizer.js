import { BaseNormalizer } from "./base.normalizer.js";

export class M365Normalizer extends BaseNormalizer {
  constructor() {
    super("m365");
  }

  normalize(data, tenantId) {
    const tags = [];
    const eventType = data.event_type || "";
    const workload = data.workload || "";

    let action = null;
    let severity = data.severity || 3;

    if (eventType.includes("LoggedIn") || eventType.includes("Login")) {
      if (data.status === "Success") {
        action = "login";
        tags.push("auth-success");
      } else {
        action = "deny";
        severity = Math.max(severity, 4);
        tags.push("auth-failure");
      }
    }

    if (eventType.includes("Accessed") || eventType.includes("Downloaded")) {
      action = "allow";
      tags.push("file-access");
    }

    if (eventType.includes("Sharing") || eventType.includes("SharingSet")) {
      action = "create";
      tags.push("sharing");
      if (data.sharing_type === "AnonymousLink") {
        severity = Math.max(severity, 6);
        tags.push("anonymous-sharing");
        tags.push("data-exposure-risk");
      }
    }

    if (eventType.includes("MemberAdded") || eventType.includes("GroupMember")) {
      action = "create";
      tags.push("group-change");
      severity = Math.max(severity, 5);
    }

    if (eventType.includes("MailItems") || eventType.includes("Mailbox")) {
      tags.push("email");
      if (data.item_count && data.item_count > 50) {
        tags.push("bulk-access");
        severity = Math.max(severity, 5);
      }
    }

    if (workload) {
      tags.push(`workload:${workload.toLowerCase()}`);
    }

    if (workload === "Exchange") {
      tags.push("exchange");
    } else if (workload === "SharePoint") {
      tags.push("sharepoint");
    } else if (workload === "OneDrive") {
      tags.push("onedrive");
    } else if (workload === "AzureActiveDirectory") {
      tags.push("aad");
    }

    if (data.status === "Failure") {
      tags.push("failed");
      if (data.failure_reason) {
        tags.push(`failure:${data.failure_reason.toLowerCase()}`);
      }
    }

    const result = {
      ...this.baseEvent(data, tenantId),
      event_type: eventType,
      severity,
      action,
      src_ip: data.src_ip || data.ip,
      user: data.user,
      url: data.file_path,
    };

    if (data.group_name) {
      tags.push(`group:${data.group_name}`);
    }

    if (data.member_added) {
      tags.push(`member:${data.member_added}`);
    }

    if (data.target_mailbox) {
      tags.push(`target:${data.target_mailbox}`);
    }

    result._tags = this.generateTags(result, tags);
    return result;
  }
}
