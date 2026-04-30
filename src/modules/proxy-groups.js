// Shared group name constants, used by both proxy-groups and rules
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

// Map region code to group name
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

function buildAllRegionProxies(features) {
  const all = [
    ...features.regions.core,
    ...features.regions.extended,
    ...features.regions.special,
  ];
  return [GROUP.AUTO, ...all.map(r => REGION_GROUP_MAP[r])];
}

function buildRegionGroups(regions, features) {
  const allRegionKeys = [
    ...features.regions.core,
    ...features.regions.extended,
    ...features.regions.special,
  ];

  return allRegionKeys.map(key => ({
    name: REGION_GROUP_MAP[key],
    type: 'url-test',
    url: 'https://cp.cloudflare.com/generate_204',
    interval: 300,
    tolerance: 50,
    proxies: regions[key],
  }));
}

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

  // IM
  if (features.proxyGroups.social) {
    groups.push({
      name: GROUP.IM,
      type: 'select',
      proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // Social media
  if (features.proxyGroups.social) {
    groups.push({
      name: GROUP.SOCIAL,
      type: 'select',
      proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // Special groups (Talkatone)
  if (features.proxyGroups.special) {
    groups.push({
      name: GROUP.TALKATONE,
      type: 'select',
      proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // GitHub
  if (features.proxyGroups.social) {
    groups.push({
      name: GROUP.GITHUB,
      type: 'select',
      proxies: [GROUP.MANUAL, ...allProxies, GROUP.DIRECT, ...safeProxies],
    });
  }

  // AI services - use fallback for high availability
  if (features.proxyGroups.ai) {
    groups.push({
      name: GROUP.CHATGPT,
      type: 'fallback',
      url: 'https://chat.openai.com/cdn-cgi/trace',
      interval: 300,
      'expected-status': 204,
      proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
    groups.push({
      name: GROUP.AI,
      type: 'fallback',
      url: 'https://chat.openai.com/cdn-cgi/trace',
      interval: 300,
      'expected-status': 204,
      proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  if (features.proxyGroups.special) {
    groups.push({
      name: GROUP.COPILOT,
      type: 'select',
      proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // TikTok
  if (features.proxyGroups.social) {
    groups.push({
      name: GROUP.TIKTOK,
      type: 'select',
      proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // Streaming - use load-balance for even distribution
  if (features.proxyGroups.streaming) {
    const streamingGroups = [
      GROUP.YOUTUBE, GROUP.NETFLIX, GROUP.DISNEY,
      GROUP.HBO, GROUP.PRIMEVIDEO,
    ];
    for (const name of streamingGroups) {
      groups.push({
        name,
        type: 'load-balance',
        strategy: 'consistent-hashing',
        url: 'https://cp.cloudflare.com/generate_204',
        interval: 300,
        proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
      });
    }
  }

  // AppleTV+ (includes DIRECT)
  if (features.proxyGroups.streaming) {
    groups.push({
      name: GROUP.APPLETV,
      type: 'load-balance',
      strategy: 'consistent-hashing',
      url: 'https://cp.cloudflare.com/generate_204',
      interval: 300,
      proxies: [GROUP.MANUAL, ...allProxies, GROUP.DIRECT, ...safeProxies],
    });
  }

  // Emby
  if (features.proxyGroups.streaming) {
    groups.push({
      name: GROUP.EMBY,
      type: 'select',
      proxies: [GROUP.MANUAL, GROUP.AUTO, GROUP.DIRECT, ...allProxies, ...safeProxies],
    });
  }

  // Spotify
  if (features.proxyGroups.streaming) {
    groups.push({
      name: GROUP.SPOTIFY,
      type: 'select',
      proxies: [GROUP.MANUAL, GROUP.AUTO, GROUP.DIRECT, ...allProxies, ...safeProxies],
    });
  }

  // Bahamut (Taiwan only)
  if (features.proxyGroups.streaming) {
    groups.push({
      name: GROUP.BAHAMUT,
      type: 'select',
      proxies: [GROUP.TW, GROUP.MANUAL, GROUP.DIRECT],
    });
  }

  // Media, Ecommerce
  if (features.proxyGroups.social) {
    groups.push({
      name: GROUP.MEDIA,
      type: 'select',
      proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
    groups.push({
      name: GROUP.ECOMMERCE,
      type: 'select',
      proxies: [GROUP.MANUAL, GROUP.AUTO, ...allProxies, ...safeProxies],
    });
  }

  // Google services
  if (features.proxyGroups.social) {
    groups.push({
      name: GROUP.FCM,
      type: 'select',
      proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
    groups.push({
      name: GROUP.GOOGLE,
      type: 'select',
      proxies: [GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // Apple & Microsoft
  if (features.proxyGroups.social) {
    groups.push({
      name: GROUP.APPLE,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
    groups.push({
      name: GROUP.MICROSOFT,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // Special groups (OneDrive, PayPal)
  if (features.proxyGroups.special) {
    groups.push({
      name: GROUP.ONEDRIVE,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
    groups.push({
      name: GROUP.PAYPAL,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // Gaming
  if (features.proxyGroups.gaming) {
    groups.push({
      name: GROUP.GAMING,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
    groups.push({
      name: GROUP.STEAM,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // PT
  if (features.proxyGroups.special) {
    groups.push({
      name: GROUP.PT,
      type: 'select',
      proxies: [...allProxies, GROUP.MANUAL, GROUP.AUTO, GROUP.DIRECT, ...safeProxies],
    });
  }

  // Speed test, catch-all, non-standard port (always present)
  groups.push({
    name: GROUP.SPEEDTEST,
    type: 'select',
    proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
  });
  groups.push({
    name: GROUP.CATCH_ALL,
    type: 'select',
    proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
  });
  groups.push({
    name: GROUP.NON_STD,
    type: 'select',
    proxies: [GROUP.CATCH_ALL, GROUP.DIRECT],
  });

  return groups;
}
