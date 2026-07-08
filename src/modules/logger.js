export const LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: Infinity,
  off: Infinity,
};

const DEFAULT_LEVEL = 'info';
const LOGGER_NAME = 'clash-script-adapter';
const SIMPLE_VALUE_RE = /^[A-Za-z0-9_.:/@+-]+$/;

function normalizeLevelName(level, fallbackLevel = DEFAULT_LEVEL) {
  const fallbackName = typeof fallbackLevel === 'string' ?
    fallbackLevel.trim().toLowerCase() :
    DEFAULT_LEVEL;
  const fallback = Object.prototype.hasOwnProperty.call(LEVELS, fallbackName) ?
    fallbackName :
    DEFAULT_LEVEL;
  const name = typeof level === 'string' ?
    level.trim().toLowerCase() :
    fallback;

  return Object.prototype.hasOwnProperty.call(LEVELS, name) ? name : fallback;
}

export function normalizeLogLevel(level, fallbackLevel = DEFAULT_LEVEL) {
  if (typeof level === 'number') {
    return level >= LEVELS.trace || level === Infinity ? level : LEVELS[DEFAULT_LEVEL];
  }

  const name = normalizeLevelName(level, fallbackLevel);
  return LEVELS[name];
}

function serializeContextValue(value) {
  if (value === undefined) return undefined;
  if (value === null) return 'null';

  if (typeof value === 'string') {
    return SIMPLE_VALUE_RE.test(value) ? value : JSON.stringify(value);
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? String(value) : serialized;
  } catch (_err) {
    return '[unserializable]';
  }
}

function formatContext(context) {
  if (!context || typeof context !== 'object') return [];

  return Object.keys(context).sort().reduce((parts, key) => {
    const value = serializeContextValue(context[key]);
    return value === undefined ? parts : [...parts, `${key}=${value}`];
  }, []);
}

export function formatLogLine(level, namespace, event, context = {}, now = new Date()) {
  const levelName = normalizeLevelName(level).toUpperCase();
  const base = `${now.toISOString()} ${levelName} ${LOGGER_NAME}.${namespace} ${event}`;
  const contextParts = formatContext(context);

  return contextParts.length > 0 ? `${base} ${contextParts.join(' ')}` : base;
}

function writeToConsole(levelName, line) {
  if (typeof console === 'undefined') return;

  if (levelName === 'error' && typeof console.error === 'function') {
    console.error(line);
    return;
  }

  if (levelName === 'warn' && typeof console.warn === 'function') {
    console.warn(line);
    return;
  }

  if (levelName !== 'error' && levelName !== 'warn' && typeof console.log === 'function') {
    console.log(line);
  }
}

export function createLogger(namespace, options = {}) {
  const threshold = options.enabled === false ?
    LEVELS.silent :
    normalizeLogLevel(options.level, DEFAULT_LEVEL);

  function log(level, event, context = {}) {
    const levelName = normalizeLevelName(level);
    if (LEVELS[levelName] < threshold) return;

    try {
      writeToConsole(levelName, formatLogLine(levelName, namespace, event, context));
    } catch (_err) {
      return;
    }
  }

  return {
    trace: (event, context) => log('trace', event, context),
    debug: (event, context) => log('debug', event, context),
    info: (event, context) => log('info', event, context),
    warn: (event, context) => log('warn', event, context),
    error: (event, context) => log('error', event, context),
  };
}
