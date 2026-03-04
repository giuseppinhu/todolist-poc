function formatLog(level, message, metadata = {}) {
  return {
    level,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };
}

function logInfo(message, metadata) {
  const entry = formatLog("INFO", message, metadata);
  console.log(`[${entry.timestamp}] [${entry.level}] ${entry.message}`, entry.metadata);
  return entry;
}

function logError(message, metadata) {
  const entry = formatLog("ERROR", message, metadata);
  console.error(`[${entry.timestamp}] [${entry.level}] ${entry.message}`, entry.metadata);
  return entry;
}

module.exports = { logInfo, logError };
