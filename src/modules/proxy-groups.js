// Shared group names used by proxy-groups.js and rules.js.
export const GROUP = {
  AUTO: '♻️ Auto Select',
  MANUAL: '🚀 Manual Select',
  DIRECT: '🎯 Direct',
  STABLE: '🔒 Fixed Exit',
  CATCH_ALL: '🐟 Final',
  NON_STD: '🔀 Non-Standard Ports',
  // Regional groups
  HK: '🇭🇰 Hong Kong',
  US: '🇺🇸 United States',
  JP: '🇯🇵 Japan',
  SG: '🇸🇬 Singapore',
  TW: '🇼🇸 Taiwan',
  KR: '🇰🇷 South Korea',
  CA: '🇨🇦 Canada',
  GB: '🇬🇧 United Kingdom',
  FR: '🇫🇷 France',
  DE: '🇩🇪 Germany',
  NL: '🇳🇱 Netherlands',
  TR: '🇹🇷 Turkey',
  RU: '🇷🇺 Russia',
  OTHER: '🌐 Other Regions',
  HOME: '🏠 Residential',
  LOW: '🐢 Low Rate',
  // Service groups
  IM: '💬 Instant Messaging',
  SOCIAL: '🌐 Social Media',
  TALKATONE: '📞 Talkatone',
  GITHUB: '🚀 GitHub',
  CHATGPT: '🤖 ChatGPT',
  COPILOT: '🤖 Copilot',
  AI: '🤖 AI Services',
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
  MEDIA: '🌎 Global Media',
  ECOMMERCE: '🛒 E-Commerce',
  FCM: '📢 Google FCM',
  GOOGLE: '🇬 Google Services',
  APPLE: '🍎 Apple Services',
  MICROSOFT: 'Ⓜ️ Microsoft Services',
  ONEDRIVE: '💾 OneDrive',
  PAYPAL: '💳 PayPal',
  GAMING: '🎮 Gaming',
  STEAM: '🎮 Steam',
  PT: '⏬ PT Sites',
  SPEEDTEST: '🚀 Speedtest',
};

// Region code to group name mapping.
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

// Build every enabled regional group reference.
function buildAllRegionProxies(features, activeRegionGroups = null) {
  if (activeRegionGroups) {
    return [
      GROUP.AUTO,
      ...activeRegionGroups.map(group => group.name).filter(Boolean),
    ];
  }

  const regions = features?.regions || {};
  const all = [
    ...(regions.core || []),
    ...(regions.extended || []),
    ...(regions.special || []),
  ];
  return [GROUP.AUTO, ...all.map(r => REGION_GROUP_MAP[r]).filter(Boolean)];
}

// Build regional url-test groups from features.regions.
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

function dedupeProxies(proxies) {
  return proxies.filter((proxy, index, allProxies) => (
    proxy && allProxies.indexOf(proxy) === index
  ));
}

function hasRealProxy(proxies) {
  return (proxies || []).some(proxy => proxy && proxy !== 'DIRECT');
}

function getAvailableRegionGroupNames(regionGroups) {
  return regionGroups
    .filter(group => hasRealProxy(group.proxies))
    .map(group => group.name)
    .filter(Boolean);
}

function buildOrderedProxyChoices(regionGroups, preferredRegions, safeProxies) {
  const availableRegionNames = getAvailableRegionGroupNames(regionGroups);
  const preferredNames = preferredRegions
    .map(region => REGION_GROUP_MAP[region])
    .filter(name => availableRegionNames.indexOf(name) !== -1);
  const remainingNames = availableRegionNames.filter(name => (
    preferredNames.indexOf(name) === -1
  ));

  return [
    ...preferredNames,
    GROUP.MANUAL,
    GROUP.AUTO,
    ...remainingNames,
    ...safeProxies,
  ];
}

function buildPrunedRegionGroupNames(regionGroups, pruneEmptyRegions) {
  if (!pruneEmptyRegions) {
    return [];
  }

  return regionGroups
    .filter(group => !hasRealProxy(group.proxies))
    .map(group => group.name)
    .filter(Boolean);
}

function filterRegionGroups(regionGroups, prunedRegionGroupNames) {
  if (prunedRegionGroupNames.length === 0) {
    return regionGroups;
  }

  return regionGroups.filter(group => (
    prunedRegionGroupNames.indexOf(group.name) === -1
  ));
}

function removePrunedRegionReferences(proxies, prunedRegionGroupNames) {
  if (prunedRegionGroupNames.length === 0) {
    return proxies;
  }

  return proxies.filter(proxy => (
    prunedRegionGroupNames.indexOf(proxy) === -1
  ));
}

// Build the fixed single-node egress groups used by the AI preset.
// Regional url-test groups and AUTO/MANUAL are omitted on purpose so the
// selected node can never drift between regions. No Direct selector is
// emitted: DIRECT is a builtin outbound, so a single-option group would only
// add a switch that can change nothing.
function buildStableProxyGroups(regions, safeProxies, logger = null) {
  const preferredRegions = ['us', 'sg', 'jp', 'hk'];
  const preferredProxies = [];
  for (const region of preferredRegions) {
    for (const proxy of regions[region] || []) {
      preferredProxies.push(proxy);
    }
  }

  const exitProxies = dedupeProxies([
    ...preferredProxies,
    ...safeProxies,
  ]).filter(proxy => proxy && proxy !== 'DIRECT');
  const fixedProxies = exitProxies.length > 0 ? exitProxies : ['DIRECT'];
  // Vendor groups default to DIRECT, then delegate to the Fixed Exit group
  // so the whole exit selection can be switched in one place.
  const vendorProxies = dedupeProxies(['DIRECT', GROUP.STABLE, ...fixedProxies]);

  const groups = [
    {
      name: GROUP.STABLE,
      type: 'select',
      proxies: fixedProxies,
    },
    {
      name: GROUP.MICROSOFT,
      type: 'select',
      proxies: [...vendorProxies],
    },
    {
      name: GROUP.APPLE,
      type: 'select',
      proxies: [...vendorProxies],
    },
  ];

  if (logger) {
    logger.info('proxy-groups-built', {
      fixedProxyCount: fixedProxies.length,
      groupCount: groups.length,
      mode: 'stable',
      preferredProxyCount: preferredProxies.length,
      safeProxyCount: safeProxies.length,
    });
  }

  return groups;
}

/**
 * Build proxy groups from feature switches.
 */
export function buildProxyGroups(regions, safeProxies, features, logger = null) {
  if (features?.proxyGroups?.stableEgress) {
    return buildStableProxyGroups(regions, safeProxies, logger);
  }

  const pruneEmptyRegions = features?.proxyGroups?.pruneEmptyRegions === true;
  const rawRegionGroups = buildRegionGroups(regions, features);
  const prunedRegionGroupNames = buildPrunedRegionGroupNames(
    rawRegionGroups,
    pruneEmptyRegions
  );
  const regionGroups = filterRegionGroups(rawRegionGroups, prunedRegionGroupNames);
  const allProxies = buildAllRegionProxies(features, regionGroups);

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

  // Social and common services.
  if (features?.proxyGroups?.social) {
    const socialGroups = [
      GROUP.IM,
      GROUP.SOCIAL,
      GROUP.TIKTOK,
      GROUP.MEDIA,
      GROUP.ECOMMERCE,
      GROUP.FCM,
      GROUP.GOOGLE,
    ];
    for (const name of socialGroups) {
      groups.push({
        name,
        type: 'select',
        proxies: [GROUP.AUTO, GROUP.MANUAL, ...allProxies, ...safeProxies],
      });
    }

    groups.push({
      name: GROUP.GITHUB,
      type: 'select',
      proxies: [
        GROUP.AUTO,
        GROUP.MANUAL,
        ...allProxies,
        ...safeProxies,
        GROUP.DIRECT,
      ],
    });

    groups.push({
      name: GROUP.APPLE,
      type: 'select',
      proxies: [
        GROUP.DIRECT,
        GROUP.AUTO,
        GROUP.MANUAL,
        ...allProxies,
        ...safeProxies,
      ],
    });

    groups.push({
      name: GROUP.MICROSOFT,
      type: 'select',
      proxies: [
        GROUP.DIRECT,
        GROUP.AUTO,
        GROUP.MANUAL,
        ...allProxies,
        ...safeProxies,
      ],
    });
  }

  // AI services default to US, then nearby workable regions.
  if (features?.proxyGroups?.ai) {
    groups.push({
      name: GROUP.AI,
      type: 'select',
      proxies: buildOrderedProxyChoices(
        regionGroups,
        ['us', 'sg', 'jp', 'hk'],
        safeProxies
      ),
    });
  }

  // Special services.
  if (features?.proxyGroups?.special) {
    groups.push({
      name: GROUP.TALKATONE,
      type: 'select',
      proxies: [
        GROUP.US,
        GROUP.MANUAL,
        ...allProxies,
        ...safeProxies,
      ].filter(Boolean),
    });

    const directFirstSpecial = [GROUP.ONEDRIVE, GROUP.PAYPAL];
    for (const name of directFirstSpecial) {
      groups.push({
        name,
        type: 'select',
        proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
      });
    }

    groups.push({
      name: GROUP.PT,
      type: 'select',
      proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
    });
  }

  // Streaming services.
  if (features?.proxyGroups?.streaming) {
    const asianStreaming = [GROUP.NETFLIX, GROUP.DISNEY, GROUP.SPOTIFY, GROUP.EMBY];
    for (const name of asianStreaming) {
      groups.push({
        name,
        type: 'select',
        proxies: [
          GROUP.HK,
          GROUP.SG,
          GROUP.TW,
          GROUP.MANUAL,
          ...allProxies,
          ...safeProxies,
        ].filter(Boolean),
      });
    }

    groups.push({
      name: GROUP.YOUTUBE,
      type: 'select',
      proxies: buildOrderedProxyChoices(
        regionGroups,
        ['hk', 'jp', 'sg', 'tw'],
        safeProxies
      ),
    });

    // HBO and Prime Video generally need US nodes.
    const usStreaming = [GROUP.HBO, GROUP.PRIMEVIDEO];
    for (const name of usStreaming) {
      groups.push({
        name,
        type: 'select',
        proxies: [
          GROUP.US,
          GROUP.MANUAL,
          ...allProxies,
          ...safeProxies,
        ].filter(Boolean),
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
      proxies: [GROUP.TW, GROUP.DIRECT, GROUP.MANUAL].filter(Boolean),
    });
  }

  // Gaming.
  if (features?.proxyGroups?.gaming) {
    const gamingGroups = [GROUP.GAMING, GROUP.STEAM];
    for (const name of gamingGroups) {
      groups.push({
        name,
        type: 'select',
        proxies: [
          GROUP.HK,
          GROUP.DIRECT,
          GROUP.MANUAL,
          ...allProxies,
          ...safeProxies,
        ].filter(Boolean),
      });
    }
  }

  // Speedtest, final fallback, and non-standard ports.
  groups.push({
    name: GROUP.SPEEDTEST,
    type: 'select',
    proxies: [GROUP.DIRECT, GROUP.MANUAL, ...allProxies, ...safeProxies],
  });
  groups.push({
    name: GROUP.CATCH_ALL,
    type: 'select',
    proxies: [GROUP.AUTO, GROUP.MANUAL, ...allProxies, ...safeProxies, GROUP.DIRECT],
  });
  groups.push({
    name: GROUP.NON_STD,
    type: 'select',
    proxies: [GROUP.DIRECT, GROUP.CATCH_ALL],
  });

  const prunedGroups = groups.map(group => ({
    ...group,
    proxies: removePrunedRegionReferences(group.proxies, prunedRegionGroupNames),
  }));

  const result = prunedGroups.map(group => ({
    ...group,
    proxies: dedupeProxies(group.proxies),
  }));

  if (logger) {
    const dedupedGroupCount = prunedGroups.filter((group, index) => (
      group.proxies.length !== result[index].proxies.length
    )).length;

    logger.info('proxy-groups-built', {
      ai: features?.proxyGroups?.ai === true,
      dedupedGroupCount,
      gaming: features?.proxyGroups?.gaming === true,
      groupCount: result.length,
      regionGroupCount: regionGroups.length,
      prunedRegionGroupCount: prunedRegionGroupNames.length,
      safeProxyCount: safeProxies.length,
      social: features?.proxyGroups?.social === true,
      special: features?.proxyGroups?.special === true,
      streaming: features?.proxyGroups?.streaming === true,
    });
  }

  return result;
}
