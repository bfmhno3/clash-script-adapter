import { GROUP } from './proxy-groups.js';

// ====== Basic rules (always included) ======
// Private networks, custom rulesets, and China-direct services.
const BASIC_RULES = [
  'GEOSITE,private,' + GROUP.DIRECT,
  'RULE-SET,private_IP,' + GROUP.DIRECT + ',no-resolve',
  'RULE-SET,giveup_direct,' + GROUP.DIRECT,
  'RULE-SET,giveup_proxy,' + GROUP.MANUAL,
  'RULE-SET,Custom_Direct_Domain,' + GROUP.DIRECT,
  'RULE-SET,Custom_Direct_IP,' + GROUP.DIRECT + ',no-resolve',
  'RULE-SET,Custom_Proxy_Domain,' + GROUP.MANUAL,
  'RULE-SET,Custom_Proxy_IP,' + GROUP.MANUAL + ',no-resolve',
  'GEOSITE,google-cn,' + GROUP.DIRECT,
  'GEOSITE,category-games@cn,' + GROUP.DIRECT,
  'RULE-SET,Steam_CDN_Domain,' + GROUP.DIRECT,
  'RULE-SET,Steam_CDN_IP,' + GROUP.DIRECT + ',no-resolve',
  'GEOSITE,category-game-platforms-download,' + GROUP.DIRECT,
  'GEOSITE,category-public-tracker,' + GROUP.DIRECT,
];

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
const AI_RULES = [
  'GEOSITE,openai,' + GROUP.AI,
  'GEOSITE,google-gemini,' + GROUP.AI,
  'GEOSITE,category-ai-!cn,' + GROUP.AI,
];

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

/**
 * Build route rules from feature switches.
 * @param {Object} features Feature switches.
 * @param {string} [platform] Platform included in logging context.
 * @returns {string[]} Rules in Clash format.
 */
export function buildRules(features, platform, logger = null) {
  const rules = [
    ...BASIC_RULES,
    ...(features.rules.streaming ? STREAMING_RULES : []),
    ...(features.rules.ai ? AI_RULES : []),
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
