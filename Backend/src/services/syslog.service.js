import SyslogServer from "syslog-server";
import logger from "../config/logger.js";

let server = null;

export function startSyslogServer(port = 514) {
  server = new SyslogServer();

  server.on("message", (value) => {
    logger.info(`Syslog received:`, {
      date: value.date,
      host: value.host,
      protocol: value.protocol,
      message: value.message,
    });
  });

  server.on("error", (err) => {
    logger.error("Syslog server error:", err);
  });

  server.start({ port });
  logger.info(`Syslog server listening on port ${port}`);
}

export function stopSyslogServer() {
  if (server) {
    server.stop();
    server = null;
    logger.info("Syslog server stopped");
  }
}
