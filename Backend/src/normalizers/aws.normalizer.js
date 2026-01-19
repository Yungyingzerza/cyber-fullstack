import { BaseNormalizer } from "./base.normalizer.js";

export class AwsNormalizer extends BaseNormalizer {
  constructor() {
    super("aws");
  }

  normalize(data, tenantId) {
    const tags = [];
    const eventType = data.event_type || data.raw?.eventName || "";

    let action = null;
    let severity = data.severity || 3;

    if (eventType.startsWith("Create") || eventType.startsWith("Put") || eventType.startsWith("Run")) {
      action = "create";
    } else if (eventType.startsWith("Delete") || eventType.startsWith("Remove") || eventType.startsWith("Terminate")) {
      action = "delete";
      severity = Math.max(severity, 5);
    } else if (eventType.startsWith("Attach") || eventType.startsWith("Add")) {
      action = "create";
    } else if (eventType.startsWith("Detach")) {
      action = "delete";
    } else if (eventType === "AssumeRole" || eventType.includes("Login")) {
      action = "login";
    } else if (eventType === "StopLogging") {
      action = "delete";
      severity = 9;
      tags.push("audit-tampering");
      tags.push("critical");
    }

    const service = data.cloud?.service || "";

    if (service === "iam") {
      tags.push("iam");
      if (eventType.includes("Policy") && eventType.includes("Admin")) {
        severity = Math.max(severity, 7);
        tags.push("privilege-escalation");
      }
      if (eventType === "CreateUser" || eventType === "DeleteUser") {
        tags.push("user-management");
        severity = Math.max(severity, 5);
      }
    }

    if (service === "s3") {
      tags.push("s3");
      if (eventType.includes("BucketPolicy") || eventType.includes("BucketAcl")) {
        tags.push("policy-change");
        severity = Math.max(severity, 6);
      }
    }

    if (service === "ec2") {
      tags.push("ec2");
      if (eventType === "RunInstances") {
        tags.push("resource-creation");
      }
    }

    if (service === "sts") {
      tags.push("sts");
      if (eventType === "AssumeRole") {
        tags.push("role-assumption");
        if (data.raw?.requestParameters?.roleArn?.includes("Admin")) {
          severity = Math.max(severity, 6);
          tags.push("admin-access");
        }
      }
    }

    if (service === "cloudtrail") {
      tags.push("cloudtrail");
    }

    if (service === "lambda") {
      tags.push("lambda");
    }

    if (service === "rds") {
      tags.push("rds");
      tags.push("database");
    }

    const result = {
      ...this.baseEvent(data, tenantId),
      event_type: eventType,
      severity,
      action,
      src_ip: data.src_ip || data.sourceIPAddress,
      user: data.user || data.userIdentity?.userName,
      cloud_account_id: data.cloud?.account_id,
      cloud_region: data.cloud?.region,
      cloud_service: service,
    };

    result._tags = this.generateTags(result, tags);
    return result;
  }
}
