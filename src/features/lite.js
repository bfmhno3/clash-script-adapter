/**
 * 轻量方案 features 配置
 * 适用场景：低性能设备、路由器，3 个精简地区，最少规则集
 */
export const features = {
  tun: false,       // 不包含 TUN
  sniffer: false,   // 不包含嗅探器（减少资源占用）
  ntp: false,       // 不包含 NTP

  // 地区选择：仅 3 个最常用地区
  regions: {
    core: ['hk', 'us', 'jp'],
    extended: [],
    special: [],
  },

  // 代理组选择：仅基础 + 地区 + 流媒体
  proxyGroups: {
    basic: true,
    regional: true,
    streaming: true,
    ai: false,        // 不含 AI 服务组
    social: false,    // 不含社交媒体组
    gaming: false,    // 不含游戏组
    special: false,   // 不含特殊组
  },

  // 规则选择：仅基础 + 流媒体
  rules: {
    basic: true,
    streaming: true,
    ai: false,
    social: false,
    gaming: false,
    special: false,
    process: false,
  },
};
