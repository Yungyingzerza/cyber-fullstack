import { Router } from "express";
import multer from "multer";
import { authenticate, requireRole, tenantIsolation } from "../middlewares/auth.middleware.js";
import { validate, singleEventSchema, batchEventSchema } from "../validators/ingest.validator.js";
import * as ingestService from "../services/ingest.service.js";
import logger from "../config/logger.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const filename = file.originalname.toLowerCase();
    const isJson = file.mimetype === "application/json" || filename.endsWith(".json");
    const isText = file.mimetype === "text/plain" || filename.endsWith(".txt") || filename.endsWith(".syslog") || filename.endsWith(".log");
    if (isJson || isText) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JSON, txt, syslog, and log files are allowed.`));
    }
  },
});

// Parse syslog priority to get severity (0-7) and map to our scale (0-10)
function parseSyslogSeverity(priority) {
  const syslogSeverity = priority % 8;
  // Map syslog severity (0=emergency, 7=debug) to our scale (0-10)
  const severityMap = {
    0: 10, // Emergency
    1: 9,  // Alert
    2: 8,  // Critical
    3: 7,  // Error
    4: 5,  // Warning
    5: 3,  // Notice
    6: 2,  // Informational
    7: 1,  // Debug
  };
  return severityMap[syslogSeverity] ?? 3;
}

// Parse a syslog line into an event object
function parseSyslogLine(line) {
  const event = {
    raw: line,
  };

  // Extract priority: <134>
  const priorityMatch = line.match(/^<(\d+)>/);
  if (priorityMatch) {
    const priority = parseInt(priorityMatch[1]);
    event.severity = parseSyslogSeverity(priority);
    line = line.slice(priorityMatch[0].length);
  }

  // Extract timestamp and hostname: Aug 20 12:44:56 fw01
  const headerMatch = line.match(/^(\w+\s+\d+\s+[\d:]+)\s+(\S+)\s*/);
  if (headerMatch) {
    event.host = headerMatch[2];
    line = line.slice(headerMatch[0].length);
  }

  // Parse key=value pairs
  const kvRegex = /(\w+)=(\S+)/g;
  let match;
  while ((match = kvRegex.exec(line)) !== null) {
    const [, key, value] = match;
    switch (key.toLowerCase()) {
      case "action":
        event.action = value;
        break;
      case "src":
        event.src_ip = value;
        break;
      case "dst":
        event.dst_ip = value;
        break;
      case "spt":
        event.src_port = parseInt(value);
        break;
      case "dpt":
        event.dst_port = parseInt(value);
        break;
      case "proto":
        event.protocol = value;
        break;
      case "msg":
        event.message = value;
        break;
      case "event":
        event.event_type = value;
        break;
      case "vendor":
        event.vendor = value;
        break;
      case "product":
        event.product = value;
        break;
      case "if":
        event.interface = value;
        break;
      case "mac":
        event.mac = value;
        break;
      case "policy":
        event.rule_name = value;
        break;
    }
  }

  // Determine source type based on content
  // Network events: have interface (if=), link events, stp, lacp, vlan
  const networkKeywords = ["link-up", "link-down", "link-flap", "stp", "lacp", "vlan", "port-security"];
  const isNetwork = event.interface ||
    (event.event_type && networkKeywords.some(kw => event.event_type.toLowerCase().includes(kw)));

  event.source = isNetwork ? "network" : "firewall";

  // Set event_type from action if not already set
  if (!event.event_type && event.action) {
    event.event_type = event.action;
  }

  return event;
}

router.post("/", authenticate, requireRole("admin"), tenantIsolation, validate(singleEventSchema), async (req, res, next) => {
  try {
    const event = await ingestService.ingestEvent(req.body, req.user.tenant_id);
    res.status(201).json({
      message: "Event ingested successfully",
      event_id: event.id,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/batch", authenticate, requireRole("admin"), tenantIsolation, validate(batchEventSchema), async (req, res, next) => {
  try {
    const events = await ingestService.ingestBatch(req.body, req.user.tenant_id);
    res.status(201).json({
      message: "Events ingested successfully",
      count: events.length,
      event_ids: events.map((e) => e.id),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/file", authenticate, requireRole("admin"), tenantIsolation, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const content = req.file.buffer.toString("utf-8");
    const filename = req.file.originalname.toLowerCase();
    let events;

    // Detect file type by extension or mimetype
    const isJson = req.file.mimetype === "application/json" || filename.endsWith(".json");

    if (isJson) {
      try {
        const parsed = JSON.parse(content);
        // Support array, object with events array, or single event
        if (Array.isArray(parsed)) {
          events = parsed;
        } else if (parsed.events && Array.isArray(parsed.events)) {
          events = parsed.events;
        } else {
          events = [parsed];
        }
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid JSON file" });
      }
    } else {
      // Text/syslog file - parse each line
      const lines = content.split("\n").filter((line) => line.trim());
      events = lines.map((line) => parseSyslogLine(line));
    }

    if (events.length > 1000) {
      return res.status(400).json({ error: "Maximum 1000 events per file" });
    }

    const created = await ingestService.ingestBatch(events, req.user.tenant_id);

    res.status(201).json({
      message: "File processed successfully",
      filename: req.file.originalname,
      count: created.length,
    });
  } catch (error) {
    logger.error("File upload error:", error);
    next(error);
  }
});

export default router;
