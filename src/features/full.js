/**
 * 完整方案 features 配置
 * 适用场景：完整功能（TUN 透明代理），16 个地区，全量代理组和规则
 */
export const features = {
  tun: true,        // 包含 TUN 配置，支持透明代理
  sniffer: true,    // 包含嗅探器
  ntp: true,        // 包含 NTP 配置

  // 地区选择：全部 16 个地区
  regions: {
    core: ['hk', 'us', 'jp', 'sg', 'tw', 'kr'],
    extended: ['ca', 'gb', 'fr', 'de', 'nl', 'tr', 'ru'],
    special: ['other', 'home', 'low'],  // 其他地区、家宽、低倍率
  },

  // 代理组选择：全部开启
  proxyGroups: {
    basic: true,
    regional: true,
    streaming: true,
    ai: true,
    social: true,
    gaming: true,
    special: true,    // 含 Talkatone、Copilot、OneDrive、PayPal、PT 站点
  },

  // 规则选择：全部开启，含进程名规则
  rules: {
    basic: true,
    streaming: true,
    ai: true,
    social: true,
    gaming: true,
    special: true,
    process: true,    // PROCESS-NAME 规则（Android 包名 / 桌面进程名）
  },
};
