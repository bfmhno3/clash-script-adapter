import { GROUP } from './proxy-groups.js';

// ====== Basic rules (always included) ======
// Private networks, custom rulesets, and China-direct services.
function buildBasicRules(proxyTarget, directTarget = GROUP.DIRECT) {
  return [
    'GEOSITE,private,' + directTarget,
    'RULE-SET,private_IP,' + directTarget + ',no-resolve',
    'RULE-SET,giveup_direct,' + directTarget,
    'RULE-SET,giveup_proxy,' + proxyTarget,
    'RULE-SET,Custom_Direct_Domain,' + directTarget,
    'RULE-SET,Custom_Direct_IP,' + directTarget + ',no-resolve',
    'RULE-SET,Custom_Proxy_Domain,' + proxyTarget,
    'RULE-SET,Custom_Proxy_IP,' + proxyTarget + ',no-resolve',
    'GEOSITE,google-cn,' + directTarget,
    'GEOSITE,category-games@cn,' + directTarget,
    'RULE-SET,Steam_CDN_Domain,' + directTarget,
    'RULE-SET,Steam_CDN_IP,' + directTarget + ',no-resolve',
    'GEOSITE,category-game-platforms-download,' + directTarget,
    'GEOSITE,category-public-tracker,' + directTarget,
  ];
}

// ====== Streaming rules ======
const STREAMING_RULES = [
  'GEOSITE,youtube,' + GROUP.YOUTUBE,
  'GEOSITE,apple-tvplus,' + GROUP.APPLETV,
  'GEOSITE,netflix,' + GROUP.NETFLIX,
  'GEOSITE,disney,' + GROUP.DISNEY,
  'GEOSITE,hbo,' + GROUP.HBO,
  'GEOSITE,primevideo,' + GROUP.PRIMEVIDEO,
  'GEOSITE,category-emby,' + GROUP.EMBY,
  'GEOSITE,spotify,' + GROUP.SPOTIFY,
  'GEOSITE,bahamut,' + GROUP.BAHAMUT,
];

// ====== AI service rules ======
function buildAiRules(proxyTarget) {
  return [
    'GEOSITE,openai,' + proxyTarget,
    'GEOSITE,google-gemini,' + proxyTarget,
    'GEOSITE,category-ai-!cn,' + proxyTarget,
  ];
}

// ====== Social, communication, and common service rules ======
const SOCIAL_RULES = [
  'GEOSITE,category-communication,' + GROUP.IM,
  'GEOSITE,category-social-media-!cn,' + GROUP.SOCIAL,
  'GEOSITE,github,' + GROUP.GITHUB,
  'GEOSITE,category-speedtest,' + GROUP.SPEEDTEST,
  'GEOSITE,apple,' + GROUP.APPLE,
  'GEOSITE,microsoft,' + GROUP.MICROSOFT,
  'GEOSITE,google,' + GROUP.GOOGLE,
  'GEOSITE,tiktok,' + GROUP.TIKTOK,
  'GEOSITE,category-entertainment,' + GROUP.MEDIA,
  'GEOSITE,gfw,' + GROUP.MANUAL,
  'RULE-SET,telegram,' + GROUP.IM + ',no-resolve',
  'RULE-SET,twitter,' + GROUP.SOCIAL + ',no-resolve',
  'RULE-SET,facebook,' + GROUP.SOCIAL + ',no-resolve',
  'RULE-SET,google-ip,' + GROUP.GOOGLE + ',no-resolve',
  'RULE-SET,netflix-ip,' + GROUP.NETFLIX + ',no-resolve',
];

// ====== Gaming rules ======
const GAMING_RULES = [
  'GEOSITE,steam,' + GROUP.STEAM,
  'GEOSITE,category-games,' + GROUP.GAMING,
];

// ====== Special service rules ======
const SPECIAL_RULES = [
  'GEOSITE,paypal,' + GROUP.PAYPAL,
];

// ====== Tail rules (always included) ======
// China-direct rules plus MATCH; MATCH must stay last.
const TAIL_RULES = [
  'GEOSITE,cn,' + GROUP.DIRECT,
  'RULE-SET,cn-ip,' + GROUP.DIRECT + ',no-resolve',
  'MATCH,' + GROUP.CATCH_ALL,
];

// ====== Stable egress rules (AI preset) ======
// AI targets come before Apple/Microsoft so those GEOSITE rules cannot
// capture AI hostnames; everything unmatched still exits the fixed node.
// Direct targets use the builtin DIRECT outbound: the fixed-egress config
// ships no dedicated Direct selector, so no rule can be switched away from it.
function buildStableRules() {
  return [
    ...buildBasicRules(GROUP.STABLE, 'DIRECT'),
    ...buildAiRules(GROUP.STABLE),
    'GEOSITE,apple-intelligence,' + GROUP.STABLE,
    'DOMAIN-SUFFIX,openai.azure.com,' + GROUP.STABLE,
    'DOMAIN-SUFFIX,cognitiveservices.azure.com,' + GROUP.STABLE,
    'GEOSITE,apple,' + GROUP.APPLE,
    'GEOSITE,microsoft,' + GROUP.MICROSOFT,
    'GEOSITE,cn,DIRECT',
    'RULE-SET,cn-ip,DIRECT,no-resolve',
    'MATCH,' + GROUP.STABLE,
  ];
}

/**
 * Build route rules from feature switches.
 * @param {Object} features Feature switches.
 * @param {string} [platform] Platform included in logging context.
 * @returns {string[]} Rules in Clash format.
 */
export function buildRules(features, platform, logger = null) {
  if (features?.rules?.stableEgress) {
    const rules = buildStableRules();
    if (logger) {
      logger.info('rules-built', {
        mode: 'stable',
        platform,
        ruleCount: rules.length,
        stableEgress: true,
      });
    }
    return rules;
  }

  const rules = [
    ...buildBasicRules(GROUP.MANUAL),
    ...(features.rules.streaming ? STREAMING_RULES : []),
    ...(features.rules.ai ? buildAiRules(GROUP.AI) : []),
    ...(features.rules.social ? SOCIAL_RULES : []),
    ...(features.rules.gaming ? GAMING_RULES : []),
    ...(features.rules.special ? SPECIAL_RULES : []),
    ...TAIL_RULES,
  ];

  if (logger) {
    logger.info('rules-built', {
      ai: features.rules.ai,
      gaming: features.rules.gaming,
      platform,
      ruleCount: rules.length,
      social: features.rules.social,
      special: features.rules.special,
      streaming: features.rules.streaming,
    });
  }

  return rules;
}
