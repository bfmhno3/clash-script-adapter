import { GROUP } from './proxy-groups.js';

// ====== 基础规则（始终包含） ======
// 私有网络直连 + Giveup/自定义规则集 + 国内可直连服务
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

// ====== 流媒体规则 ======
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

// ====== AI 服务规则 ======
const AI_RULES = [
  'GEOSITE,openai,' + GROUP.CHATGPT,
  'GEOSITE,google-gemini,' + GROUP.AI,
  'GEOSITE,category-ai-!cn,' + GROUP.AI,
];

// ====== 社交/通讯/通用服务规则 ======
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

// ====== 游戏规则 ======
const GAMING_RULES = [
  'GEOSITE,steam,' + GROUP.STEAM,
  'GEOSITE,category-games,' + GROUP.GAMING,
];

// ====== 特殊服务规则（PayPal） ======
const SPECIAL_RULES = [
  'GEOSITE,paypal,' + GROUP.PAYPAL,
];

// ====== 进程名规则（按平台过滤） ======
const PROCESS_RULES_ANDROID = [
  'PROCESS-NAME,com.android.captiveportallogin,' + GROUP.DIRECT,
  'PROCESS-NAME,com.android.chrome,' + GROUP.MANUAL,
];

const PROCESS_RULES_WINDOWS = [
  'PROCESS-NAME,chrome.exe,' + GROUP.MANUAL,
  'PROCESS-NAME,firefox.exe,' + GROUP.MANUAL,
];

const PROCESS_RULES_MACOS = [
  'PROCESS-NAME,Safari,' + GROUP.MANUAL,
  'PROCESS-NAME,firefox,' + GROUP.MANUAL,
];

function getProcessRules(platform) {
  switch (platform) {
    case 'android': return PROCESS_RULES_ANDROID;
    case 'windows': return PROCESS_RULES_WINDOWS;
    case 'macos':   return PROCESS_RULES_MACOS;
    default:        return [];  // linux/unknown 不添加进程名规则
  }
}

// ====== 兜底规则（始终包含） ======
// 国内直连 + MATCH 兜底；MATCH 必须是最后一条规则
const TAIL_RULES = [
  'GEOSITE,cn,' + GROUP.DIRECT,
  'RULE-SET,cn-ip,' + GROUP.DIRECT + ',no-resolve',
  'MATCH,' + GROUP.CATCH_ALL,
];

/**
 * 根据 features 拼接分流规则数组。规则从上到下按严格优先级匹配。
 * @param {Object} features - 功能开关配置
 * @param {string} [platform] - 当前平台，用于过滤进程名规则
 * @returns {string[]} 规则数组，每条格式：'类型,匹配内容,策略组[,额外参数]'
 */
export function buildRules(features, platform) {
  return [
    ...BASIC_RULES,
    ...(features.rules.streaming ? STREAMING_RULES : []),
    ...(features.rules.ai ? AI_RULES : []),
    ...(features.rules.social ? SOCIAL_RULES : []),
    ...(features.rules.gaming ? GAMING_RULES : []),
    ...(features.rules.special ? SPECIAL_RULES : []),
    ...(features.rules.process ? getProcessRules(platform) : []),
    ...TAIL_RULES,
  ];
}
