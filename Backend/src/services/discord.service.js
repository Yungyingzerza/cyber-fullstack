import logger from "../config/logger.js";

export async function sendDiscordAlert(webhookUrl, alert) {
  if (!webhookUrl) {
    logger.warn("Discord webhook URL not configured");
    return false;
  }

  const severityColors = {
    0: 0x00ff00, // Green
    1: 0x00ff00,
    2: 0x00ff00,
    3: 0xffff00, // Yellow
    4: 0xffff00,
    5: 0xffa500, // Orange
    6: 0xffa500,
    7: 0xff0000, // Red
    8: 0xff0000,
    9: 0x8b0000, // Dark red
    10: 0x8b0000,
  };

  const embed = {
    title: `🚨 ${alert.title}`,
    description: alert.description || "Alert triggered",
    color: severityColors[alert.severity] || 0xff0000,
    fields: [
      {
        name: "Severity",
        value: `${alert.severity}/10`,
        inline: true,
      },
      {
        name: "Rule",
        value: alert.rule_name,
        inline: true,
      },
      {
        name: "Event Count",
        value: String(alert.event_count),
        inline: true,
      },
    ],
    timestamp: alert.triggered_at || new Date().toISOString(),
    footer: {
      text: `Tenant: ${alert.tenant_id} | Alert ID: ${alert.id}`,
    },
  };

  if (alert.group_key) {
    embed.fields.push({
      name: "Source",
      value: alert.group_key,
      inline: true,
    });
  }

  if (alert.context) {
    if (alert.context.src_ip) {
      embed.fields.push({
        name: "Source IP",
        value: alert.context.src_ip,
        inline: true,
      });
    }
    if (alert.context.user) {
      embed.fields.push({
        name: "User",
        value: alert.context.user,
        inline: true,
      });
    }
    if (alert.context.host) {
      embed.fields.push({
        name: "Host",
        value: alert.context.host,
        inline: true,
      });
    }
  }

  const payload = {
    embeds: [embed],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error(`Discord webhook failed: ${response.status} - ${text}`);
      return false;
    }

    logger.info(`Discord alert sent for alert ${alert.id}`);
    return true;
  } catch (error) {
    logger.error("Failed to send Discord alert:", error);
    return false;
  }
}
