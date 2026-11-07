export const LOGGING_ENABLED = true;
export const LOGGING_LEVEL = 'info';
// true: full fallback isolation; false: lean fake-ip DNS.
export const DNS_STRICT = false;

/**
 * AI 方案 features 配置
 * 适用场景：AI 订阅服务，国内直连，其余流量固定单节点出口
 */
export const features = {
  tun: true,        // TUN covers apps that ignore the system proxy.
  sniffer: true,    // Domain sniffing restores hostnames for fake-ip traffic.
  ntp: true,
  dns: {
    strict: DNS_STRICT,
  },
  logging: {
    enabled: LOGGING_ENABLED,
    level: LOGGING_LEVEL,
  },

  // No regional groups: the fixed exit selector ignores regions.
  regions: {
    core: [],
    extended: [],
    special: [],
  },

  proxyGroups: {
    basic: true,
    regional: false,
    streaming: false,
    ai: false,      // AI rules point at the fixed exit group instead.
    social: false,
    gaming: false,
    special: false,
    pruneEmptyRegions: false,
    // stableEgress replaces regional and AI selectors with one fixed node.
    stableEgress: true,
  },

  rules: {
    basic: true,
    streaming: false,
    ai: false,
    social: false,
    gaming: false,
    special: false,
    // stableEgress includes AI-first rules and a fixed MATCH target.
    stableEgress: true,
  },
};
