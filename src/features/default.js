/**
 * 默认方案 features 配置
 * 适用场景：通用桌面/路由器，6 个核心地区，无 TUN 透明代理
 */
export const features = {
  tun: false,       // 不包含 TUN 配置（需客户端自行配置或不需要透明代理）
  sniffer: true,    // 包含嗅探器，提升仅 IP 访问场景的分流命中率
  ntp: true,        // 包含 NTP 配置，防止时间偏差导致 TLS 握手失败

  // 地区选择：仅核心 6 区
  regions: {
    core: ['hk', 'us', 'jp', 'sg', 'tw', 'kr'],
    extended: [],   // 不包含扩展地区（CA, GB, FR, DE, NL, TR, RU）
    special: [],    // 不包含特殊分组（other, home, low）
  },

  // 代理组选择：基础 + 地区 + 流媒体 + AI + 社交 + 游戏，无特殊组
  proxyGroups: {
    basic: true,      // 手动选择、自动选择、直连
    regional: true,   // 地区组（与 regions.core 联动）
    streaming: true,  // 流媒体组（load-balance 模式）
    ai: true,         // AI 服务组（fallback 模式）
    social: true,     // 社交媒体、即时通讯、GitHub 等
    gaming: true,     // 游戏平台、Steam
    special: false,   // 不含 Talkatone、OneDrive、PayPal、PT 站点
  },

  // 规则选择：与 proxyGroups 联动
  rules: {
    basic: true,      // 私有网络、自定义规则集、国内直连
    streaming: true,  // 流媒体分流规则
    ai: true,         // AI 服务分流规则
    social: true,     // 社交/通讯/Google/Apple/Microsoft 分流规则
    gaming: true,     // 游戏分流规则
    special: false,   // 不含 Talkatone、OneDrive、Copilot、PT、PayPal 规则
    process: false,   // 不含 PROCESS-NAME 规则（桌面环境可按需开启）
  },
};
