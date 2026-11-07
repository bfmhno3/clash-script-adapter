/**
 * Local proxy cleaning.
 *
 * Airports inject informational pseudo-nodes (remaining traffic, expiry,
 * official website, support group, announcements, ...) into subscription
 * node lists. Those entries are not usable proxies and would otherwise be
 * classified into regional groups and exposed in client selectors.
 *
 * Cleaning is deterministic and local: informational name heuristics plus
 * structural validation. No network probing is performed.
 */

// Informational labels commonly used by airport placeholder nodes.
const JUNK_NAME_PATTERNS = [
  // Chinese labels.
  '剩余流量', '流量剩余', '剩余时间', '剩余天数', '剩余',
  '距离下次', '下次重置', '重置时间', '流量重置', '重置',
  '到期', '过期', '有效期', '套餐',
  '官网', '官方网站', '官方网址', '网址',
  '订阅地址', '订阅链接', '订阅',
  '客服', '售后', '群组', 'TG\\s*群', 'QQ\\s*群', '公告', '通知',
  '邀请', '推广', '购买', '续费', '充值', '优惠', '折扣', '促销', '广告',
  '欢迎使用', '节点异常', '电报',
  // English labels.
  '\\btraffic\\b', '\\bremaining\\b', '\\bexpir(?:e|ed|es|ation|y)\\b',
  '\\bwebsite\\b', '\\bofficial (?:site|website)\\b',
  '\\bsubscri(?:be|ption)\\b',
  '\\btelegram\\s*(?:group|channel|support|notice|announcement|address|link|official)\\b',
  '\\btelegram\\b.*(?:群|@)',
  '\\bsupport\\b',
  '\\bnotice\\b', '\\bannouncement\\b', '\\binvite\\b', '\\bpromo\\b',
  '\\bpurchase\\b', '\\brenew\\b', '\\bvalid until\\b',
  '\\bdays? left\\b',
];

const JUNK_NAME_RE = new RegExp(JUNK_NAME_PATTERNS.join('|'), 'i');

// Placeholder servers that cannot reach a real proxy endpoint.
const INVALID_SERVERS = [
  '0.0.0.0', '127.0.0.1', 'localhost', '::', '::1',
  'example.com', 'example.net', 'example.org', 'www.example.com',
  'invalid', 'none', 'null', 'undefined', 'n/a', '-',
];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Return true when the proxy name is an informational placeholder.
 * @param {string} name Proxy name.
 * @returns {boolean}
 */
export function isJunkProxyName(name) {
  return isNonEmptyString(name) && JUNK_NAME_RE.test(name.trim());
}

/**
 * Validate the fields required by every Clash/Mihomo proxy entry.
 * @param {Object} proxy Proxy object.
 * @returns {boolean}
 */
export function isValidProxy(proxy) {
  if (!proxy || typeof proxy !== 'object') {
    return false;
  }
  if (!isNonEmptyString(proxy.name) || !isNonEmptyString(proxy.type)) {
    return false;
  }
  if (!isValidServer(proxy.server)) {
    return false;
  }
  return isValidPort(proxy.port);
}

function isValidServer(server) {
  if (typeof server !== 'string') {
    return false;
  }

  const value = server.trim();
  if (value.length === 0) {
    return false;
  }
  if (value.indexOf('://') !== -1 || /\s/.test(value)) {
    return false;
  }

  return INVALID_SERVERS.indexOf(value.toLowerCase()) === -1;
}

function isValidPort(port) {
  if (typeof port === 'number') {
    return port > 0 && port <= 65535 && Math.floor(port) === port;
  }
  if (typeof port === 'string') {
    const value = port.trim();
    if (!/^\d+$/.test(value)) {
      return false;
    }
    const parsed = Number(value);
    return parsed > 0 && parsed <= 65535;
  }
  return false;
}

/**
 * Remove informational, structurally invalid, and duplicate proxy entries.
 * The first occurrence of a duplicate name is kept.
 *
 * @param {Array|undefined} proxies Proxy entries from the incoming config.
 * @param {Object|null} logger Logger instance.
 * @returns {Array} Cleaned proxy entries.
 */
export function cleanProxies(proxies, logger = null) {
  const input = Array.isArray(proxies) ? proxies : [];
  const seenNames = Object.create(null);
  const result = [];
  let duplicateNameCount = 0;
  let invalidConfigCount = 0;
  let junkNameCount = 0;

  for (const proxy of input) {
    if (!isValidProxy(proxy)) {
      invalidConfigCount++;
      continue;
    }

    if (isJunkProxyName(proxy.name)) {
      junkNameCount++;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(seenNames, proxy.name)) {
      duplicateNameCount++;
      continue;
    }

    seenNames[proxy.name] = true;
    result.push(proxy);
  }

  if (logger) {
    logger.info('proxies-cleaned', {
      duplicateNameCount,
      inputCount: input.length,
      invalidConfigCount,
      junkNameCount,
      outputCount: result.length,
      removedCount: input.length - result.length,
    });
  }

  return result;
}
