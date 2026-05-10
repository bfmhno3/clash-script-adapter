// 共享代理组名称常量，proxy-groups.js 和 rules.js 共同引用
// 保证组名拼写一致，避免字符串硬编码导致的不匹配
export const GROUP = {
  AUTO: '♻️ 自动选择',
  MANUAL: '🚀 手动选择',
  DIRECT: '🎯 全球直连',
  CATCH_ALL: '🐟 漏网之鱼',
  NON_STD: '🔀 非标端口',
  // Regional groups
  HK: '🇭🇰 香港节点',
  US: '🇺🇸 美国节点',
  JP: '🇯🇵 日本节点',
  SG: '🇸🇬 新加坡节点',
  TW: '🇼🇸 台湾节点',
  KR: '🇰🇷 韩国节点',
  CA: '🇨🇦 加拿大节点',
  GB: '🇬🇧 英国节点',
  FR: '🇫🇷 法国节点',
  DE: '🇩🇪 德国节点',
  NL: '🇳🇱 荷兰节点',
  TR: '🇹🇷 土耳其节点',
  RU: '🇷🇺 俄罗斯节点',
  OTHER: '🌐 其他地区',
  HOME: '🏠 家宽节点',
  LOW: '🐢 低倍率节点',
  // Service groups
  IM: '💬 即时通讯',
  SOCIAL: '🌐 社交媒体',
  TALKATONE: '📞 Talkatone',
  GITHUB: '🚀 GitHub',
  CHATGPT: '🤖 ChatGPT',
  COPILOT: '🤖 Copilot',
  AI: '🤖 AI服务',
  TIKTOK: '🎶 TikTok',
  YOUTUBE: '📹 YouTube',
  NETFLIX: '🎥 Netflix',
  DISNEY: '🎥 DisneyPlus',
  HBO: '🎥 HBO',
  PRIMEVIDEO: '🎥 PrimeVideo',
  APPLETV: '🎥 AppleTV+',
  EMBY: '🎥 Emby',
  SPOTIFY: '🎻 Spotify',
  BAHAMUT: '📺 Bahamut',
  MEDIA: '🌎 国外媒体',
  ECOMMERCE: '🛒 国外电商',
  FCM: '📢 谷歌FCM',
  GOOGLE: '🇬 谷歌服务',
  APPLE: '🍎 苹果服务',
  MICROSOFT: 'Ⓜ️ 微软服务',
  ONEDRIVE: '💾 OneDrive',
  PAYPAL: '💳 PayPal',
  GAMING: '🎮 游戏平台',
  STEAM: '🎮 Steam',
  PT: '⏬ PT站点',
  SPEEDTEST: '🚀 测速工具',
};

// 地区代码 -> 组名映射，用于 buildAllRegionProxies 展开
const REGION_GROUP_MAP = {
  hk: GROUP.HK,
  us: GROUP.US,
  jp: GROUP.JP,
  sg: GROUP.SG,
  tw: GROUP.TW,
  kr: GROUP.KR,
  ca: GROUP.CA,
  gb: GROUP.GB,
  fr: GROUP.FR,
  de: GROUP.DE,
  nl: GROUP.NL,
  tr: GROUP.TR,
  ru: GROUP.RU,
  other: GROUP.OTHER,
  home: GROUP.HOME,
  low: GROUP.LOW,
};

// 构建全量地区代理组列表：自动选择 + features 中启用的所有地区组
function buildAllRegionProxies(features) {
  const regions = features?.regions || {};
  const all = [
    ...(regions.core || []),
    ...(regions.extended || []),
    ...(regions.special || []),
  ];
  return [GROUP.AUTO, ...all.map(r => REGION_GROUP_MAP[r]).filter(Boolean)];
}

// 根据 features.regions 构建地区 url-test 组（自动测速选择最低延迟节点）
function buildRegionGroups(regionsMap, features) {
  const regions = features?.regions || {};
  const allRegionKeys = [
    ...(regions.core || []),
    ...(regions.extended || []),
    ...(regions.special || []),
  ];

  return allRegionKeys.filter(Boolean).map(key => ({
    name: REGION_GROUP_MAP[key],
    type: 'url-test',
    url: 'https://cp.cloudflare.com/generate_204',
    interval: 300,
    tolerance: 50,
    proxies: regionsMap[key] || [],
  }));
}

/**
 * 根据 features 配置构建代理组数组。
 * 始终包含基础组（自动选择、地区组、直连、手动选择），服务组按 features 开关条件添加。
 */
export function buildProxyGroups(regions, safeProxies, features) {
  const allProxies = buildAllRegionProxies(features);
  const regionGroups = buildRegionGroups(regions, features);

  // Always-present basic groups
  const groups = [
    {
      name: GROUP.AUTO,
      type: 'url-test',
      url: 'https://cp.cloudflare.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: safeProxies,
    },
    ...regionGroups,
    {
      name: GROUP.DIRECT,
      type: 'select',
      proxies: ['DIRECT'],
    },
    {
      name: GROUP.MANUAL,
      type: 'select',
      proxies: [...allProxies, ...safeProxies],
    },
  ];

  // 社交与通讯
  if (features?.proxyGroups?.social) {
    const socialGroups = [GROUP.IM, GROUP.SOCIAL, GROUP.TIKTOK, GROUP.MEDIA, GROUP.ECOMMERCE, GROUP.FCM]
    for (const name of socialGroups) {
      groups.push({
        name,
        type: 'select',
        proxies: [GROUP.AUTO, GROUP.MANUAL, ...allProxies, ...safeProxies], // 默认 AUTO 体验最好
      });
    }
    
    groups.push({
      name: GROUP.GITHUB,
      type: 'select',
      proxies: [GROUP.AUTO, GROUP.MANUAL, ...allProxies, ...safeProxies, GROUP.DIRECT],
    });

    groups.push({
      name: GROUP.APPLE,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.AUTO, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });

    groups.push({
      name: GROUP.MICROSOFT,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.AUTO, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // AI 服务，默认美/新/日节点优先
  if (features?.proxyGroups?.ai) {
    const aiGroups = [GROUP.CHATGPT, GROUP.AI, GROUP.COPILOT, GROUP.GOOGLE];
    for (const name of aiGroups) {
      groups.push({
        name,
        type: 'fallback',
        url: 'https://cp.cloudflare.com/generate_204',
        interval: 300,
        proxies: [GROUP.US, GROUP.SG, GROUP.JP, GROUP.MANUAL, ...allProxies, ...safeProxies].filter(Boolean),
      });
    }
  }

  // 特殊服务
  if (features?.proxyGroups?.special) {
    groups.push({
      name: GROUP.COPILOT,
      type: 'select',
      proxies: [GROUP.US, GROUP.MANUAL, GROUP.AUTO, ...allProxies, ...safeProxies].filter(Boolean),
    });

    groups.push({
      name: GROUP.TALKATONE,
      type: 'select',
      proxies: [GROUP.US, GROUP.MANUAL, ...allProxies, ...safeProxies].filter(Boolean),
    });

    const directFirstSpecial = [GROUP.ONEDRIVE, GROUP.PAYPAL];
    for (const name of directFirstSpecial) {
      groups.push({
        name,
        type: 'select',
        proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
      });
    }

    // PT 站点
    groups.push({
      name: GROUP.PT,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // 流媒体
  if (features?.proxyGroups?.streaming) {
    // 奈飞、迪士尼等首选新加坡或香港
    const asianStreaming = [GROUP.NETFLIX, GROUP.DISNEY, GROUP.YOUTUBE, GROUP.SPOTIFY, GROUP.EMBY];
    for (const name of asianStreaming) {
      groups.push({
        name,
        type: 'select',
        proxies: [GROUP.HK, GROUP.SG, GROUP.TW, GROUP.MANUAL, ...allProxies, ...safeProxies].filter(Boolean),
      });
    }

    // HBO, Prime 通常需要美国节点
    const usStreaming = [GROUP.HBO, GROUP.PRIMEVIDEO];
    for (const name of usStreaming) {
      groups.push({
        name,
        type: 'select',
        proxies: [GROUP.US, GROUP.MANUAL, ...allProxies, ...safeProxies].filter(Boolean),
      });
    }

    groups.push({
      name: GROUP.APPLETV,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });

    groups.push({
      name: GROUP.BAHAMUT,
      type: 'select',
      proxies: [GROUP.TW, GROUP.DIRECT, GROUP.MANUAL].filter(Boolean), // 动画疯强绑台湾
    });
  }

  // 游戏与兜底
  if (features?.proxyGroups?.gaming) {
    const gamingGroups = [GROUP.GAMING, GROUP.STEAM];
    for (const name of gamingGroups) {
      groups.push({
        name,
        type: 'select',
        proxies: [GROUP.HK, GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies].filter(Boolean),
      });
    }
  }

  // 测速、漏网之鱼、非标端口
  groups.push({
    name: GROUP.SPEEDTEST,
    type: 'select',
    proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
  });
  groups.push({
    name: GROUP.CATCH_ALL,
    type: 'select',
    proxies: [GROUP.DIRECT, GROUP.AUTO, GROUP.MANUAL, ...allProxies, ...safeProxies],
  });
  groups.push({
    name: GROUP.NON_STD,
    type: 'select',
    proxies: [GROUP.DIRECT, GROUP.CATCH_ALL],
  });

  return groups;
}
