/**
 * Structured logging helpers for CloudWatch.
 *
 * Formats log records as JSON objects so CloudWatch Logs Insights
 * can query them efficiently.
 */

const LOG_LEVEL = (process.env.LOG_LEVEL || "INFO").toUpperCase();

const LEVELS = { DEBUG: 0, INFO: 1, WARNING: 2, ERROR: 3 };
const currentLevel = LEVELS[LOG_LEVEL] ?? LEVELS.INFO;

/**
 * Emit one JSON log line that CloudWatch Logs Insights can query.
 *
 * @param {string} level   - Log level (debug, info, warning, error, exception).
 * @param {string} message - Short event identifier.
 * @param {Object} context - Additional key/value pairs to include.
 */
function log(level, message, context = {}) {
  const normalised = level.toLowerCase() === "exception" ? "error" : level.toLowerCase();
  const numericLevel = LEVELS[normalised.toUpperCase()] ?? LEVELS.INFO;

  if (numericLevel < currentLevel) return;

  const payload = JSON.stringify({ message, ...context });

  switch (normalised) {
    case "debug":
      console.debug(payload);
      break;
    case "warning":
      console.warn(payload);
      break;
    case "error":
      console.error(payload);
      break;
    default:
      console.log(payload);
  }
}

module.exports = { log };
