import { BaseNormalizer } from "./base.normalizer.js";

const LOGON_TYPES = {
  2: "Interactive",
  3: "Network",
  4: "Batch",
  5: "Service",
  7: "Unlock",
  8: "NetworkCleartext",
  9: "NewCredentials",
  10: "RemoteInteractive",
  11: "CachedInteractive",
};

const EVENT_ID_MAP = {
  4624: { type: "LogonSuccess", action: "login", severity: 2 },
  4625: { type: "LogonFailed", action: "deny", severity: 4 },
  4634: { type: "LogoffSuccess", action: "logout", severity: 1 },
  4648: { type: "ExplicitCredentialLogon", action: "login", severity: 5 },
  4720: { type: "UserCreated", action: "create", severity: 5 },
  4722: { type: "UserEnabled", action: "create", severity: 4 },
  4723: { type: "PasswordChangeAttempt", action: "alert", severity: 4 },
  4724: { type: "PasswordReset", action: "alert", severity: 5 },
  4725: { type: "UserDisabled", action: "delete", severity: 5 },
  4726: { type: "UserDeleted", action: "delete", severity: 6 },
  4728: { type: "MemberAddedToGroup", action: "create", severity: 5 },
  4729: { type: "MemberRemovedFromGroup", action: "delete", severity: 5 },
  4732: { type: "MemberAddedToLocalGroup", action: "create", severity: 5 },
  4733: { type: "MemberRemovedFromLocalGroup", action: "delete", severity: 5 },
  4740: { type: "AccountLockedOut", action: "deny", severity: 6 },
  4756: { type: "MemberAddedToUniversalGroup", action: "create", severity: 5 },
  4757: { type: "MemberRemovedFromUniversalGroup", action: "delete", severity: 5 },
  4767: { type: "AccountUnlocked", action: "allow", severity: 4 },
  4768: { type: "KerberosTGTRequest", action: "login", severity: 2 },
  4769: { type: "KerberosServiceTicket", action: "allow", severity: 2 },
  4771: { type: "KerberosPreAuthFailed", action: "deny", severity: 4 },
  4776: { type: "NTLMAuthentication", action: "login", severity: 3 },
};

// Reverse lookup: infer event ID from event_type string
const EVENT_TYPE_TO_ID = {
  // Success logins
  logonsuccess: 4624,
  login_success: 4624,
  logon_success: 4624,
  successful_logon: 4624,
  // Failed logins
  logonfailed: 4625,
  login_failure: 4625,
  logon_failure: 4625,
  failed_logon: 4625,
  login_failed: 4625,
  logon_failed: 4625,
  // Logoff
  logoffsuccess: 4634,
  logoff: 4634,
  logout: 4634,
  // Explicit credentials
  explicitcredentiallogon: 4648,
  explicit_credential_logon: 4648,
  runas: 4648,
  // User management
  usercreated: 4720,
  user_created: 4720,
  userenabled: 4722,
  user_enabled: 4722,
  passwordchangeattempt: 4723,
  password_change: 4723,
  passwordreset: 4724,
  password_reset: 4724,
  userdisabled: 4725,
  user_disabled: 4725,
  userdeleted: 4726,
  user_deleted: 4726,
  // Group membership
  memberaddedtogroup: 4728,
  member_added_to_group: 4728,
  memberremovedfromgroup: 4729,
  member_removed_from_group: 4729,
  // Account lockout
  accountlockedout: 4740,
  account_locked: 4740,
  lockout: 4740,
  accountunlocked: 4767,
  account_unlocked: 4767,
  // Kerberos
  kerberostgtrequest: 4768,
  kerberos_tgt: 4768,
  kerberosserviceticket: 4769,
  kerberos_service_ticket: 4769,
  kerberospreauthfailed: 4771,
  kerberos_preauth_failed: 4771,
  ntlmauthentication: 4776,
  ntlm_auth: 4776,
};

export class AdNormalizer extends BaseNormalizer {
  constructor() {
    super("ad");
  }

  normalize(data, tenantId) {
    const tags = [];
    // Support multiple field name variations for event ID
    let eventId = data.event_id ?? data.EventID ?? data.eventId ?? data.EventId ?? data.eventID;

    // If no event ID provided, try to infer from event_type
    if (eventId === undefined && data.event_type) {
      const normalizedType = data.event_type.toLowerCase().replace(/[-\s]/g, "_");
      eventId = EVENT_TYPE_TO_ID[normalizedType];
    }

    const eventInfo = EVENT_ID_MAP[eventId] || { type: data.event_type, action: null, severity: 3 };

    let severity = data.severity || eventInfo.severity;
    // Use event_id mapped action, or fall back to input data action
    const action = eventInfo.action || this.mapAction(data.action);

    if (eventId !== undefined && eventId !== null) {
      tags.push(`eventid:${eventId}`);
    }

    if (eventId === 4624 || eventId === 4625) {
      const logonType = data.logon_type;
      if (logonType) {
        const logonName = LOGON_TYPES[logonType] || `Type${logonType}`;
        tags.push(`logon:${logonName.toLowerCase()}`);

        if (logonType === 10) {
          tags.push("rdp");
          severity = Math.max(severity, 4);
        }

        if (logonType === 3 && eventId === 4625) {
          tags.push("network-auth-failure");
        }
      }
    }

    if (eventId === 4625) {
      tags.push("auth-failure");
      if (data.failure_reason) {
        tags.push("has-failure-reason");
      }
    }

    if (eventId === 4624) {
      tags.push("auth-success");
    }

    if (eventId === 4648) {
      tags.push("explicit-creds");
      tags.push("lateral-movement-indicator");
      severity = Math.max(severity, 5);
    }

    if ([4720, 4722, 4725, 4726].includes(eventId)) {
      tags.push("user-management");
    }

    if ([4728, 4729, 4732, 4733, 4756, 4757].includes(eventId)) {
      tags.push("group-change");
      if (data.group_name && data.group_name.toLowerCase().includes("admin")) {
        tags.push("admin-group-change");
        severity = Math.max(severity, 7);
      }
    }

    if (eventId === 4740) {
      tags.push("lockout");
      tags.push("brute-force-indicator");
    }

    if ([4768, 4769, 4771].includes(eventId)) {
      tags.push("kerberos");
    }

    if (eventId === 4771) {
      tags.push("kerberos-failure");
      tags.push("auth-failure");
    }

    const result = {
      ...this.baseEvent(data, tenantId),
      event_type: data.event_type || eventInfo.type,
      event_subtype: eventId ? `EventID-${eventId}` : undefined,
      severity,
      action,
      src_ip: data.src_ip || data.ip,
      user: data.user,
      host: data.host,
    };

    if (data.target_user) {
      tags.push(`target:${data.target_user}`);
    }

    if (data.target_server) {
      tags.push(`target-server:${data.target_server}`);
    }

    if (data.group_name) {
      tags.push(`group:${data.group_name}`);
    }

    result._tags = this.generateTags(result, tags);
    return result;
  }
}
