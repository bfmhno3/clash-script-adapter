import { GROUP } from './proxy-groups.js';

// ====== 基础规则（始终包含） ======
// 私有网络直连 + Giveup/自定义规则集 + 国内可直连服务
const BASIC_RULES = [
  'RULE-SET,private,' + GROUP.DIRECT,
  'RULE-SET,private_IP,' + GROUP.DIRECT + ',no-resolve',
  'RULE-SET,giveup_direct,' + GROUP.DIRECT,
  'RULE-SET,giveup_proxy,' + GROUP.MANUAL,
  'RULE-SET,Custom_Direct_Domain,' + GROUP.DIRECT,
  'RULE-SET,Custom_Direct_IP,' + GROUP.DIRECT + ',no-resolve',
  'RULE-SET,Custom_Proxy_Domain,' + GROUP.MANUAL,
  'RULE-SET,Custom_Proxy_IP,' + GROUP.MANUAL + ',no-resolve',
  'RULE-SET,google-cn,' + GROUP.DIRECT,
  'RULE-SET,category-games@cn,' + GROUP.DIRECT,
  'RULE-SET,Steam_CDN_Domain,' + GROUP.DIRECT,
  'RULE-SET,Steam_CDN_IP,' + GROUP.DIRECT + ',no-resolve',
  'RULE-SET,category-game-platforms-download,' + GROUP.DIRECT,
  'RULE-SET,category-public-tracker,' + GROUP.DIRECT,
];

// ====== 流媒体规则 ======
const STREAMING_RULES = [
  'RULE-SET,youtube,' + GROUP.YOUTUBE,
  'RULE-SET,apple-tvplus,' + GROUP.APPLETV,
  'RULE-SET,netflix,' + GROUP.NETFLIX,
  'RULE-SET,disney,' + GROUP.DISNEY,
  'RULE-SET,hbo,' + GROUP.HBO,
  'RULE-SET,primevideo,' + GROUP.PRIMEVIDEO,
  'RULE-SET,category-emby,' + GROUP.EMBY,
  'RULE-SET,spotify,' + GROUP.SPOTIFY,
  'RULE-SET,bahamut,' + GROUP.BAHAMUT,
];

// ====== AI 服务规则 ======
const AI_RULES = [
  'RULE-SET,openai,' + GROUP.CHATGPT,
  'RULE-SET,google-gemini,' + GROUP.AI,
  'RULE-SET,category-ai,' + GROUP.AI,
];

// ====== 社交/通讯/通用服务规则 ======
const SOCIAL_RULES = [
  'RULE-SET,category-communication,' + GROUP.IM,
  'RULE-SET,category-social-media,' + GROUP.SOCIAL,
  'RULE-SET,github,' + GROUP.GITHUB,
  'RULE-SET,category-speedtest,' + GROUP.SPEEDTEST,
  'RULE-SET,apple,' + GROUP.APPLE,
  'RULE-SET,microsoft,' + GROUP.MICROSOFT,
  'RULE-SET,google,' + GROUP.GOOGLE,
  'RULE-SET,tiktok,' + GROUP.TIKTOK,
  'RULE-SET,category-entertainment,' + GROUP.MEDIA,
  'RULE-SET,gfw,' + GROUP.MANUAL,
  'RULE-SET,telegram,' + GROUP.IM + ',no-resolve',
  'RULE-SET,twitter,' + GROUP.SOCIAL + ',no-resolve',
  'RULE-SET,facebook,' + GROUP.SOCIAL + ',no-resolve',
  'RULE-SET,google-ip,' + GROUP.GOOGLE + ',no-resolve',
  'RULE-SET,netflix-ip,' + GROUP.NETFLIX + ',no-resolve',
];

// ====== 游戏规则 ======
const GAMING_RULES = [
  'RULE-SET,steam,' + GROUP.STEAM,
  'RULE-SET,category-games,' + GROUP.GAMING,
];

// ====== 特殊服务规则（PayPal） ======
const SPECIAL_RULES = [
  'RULE-SET,PayPal,' + GROUP.PAYPAL,
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
  'RULE-SET,cn,' + GROUP.DIRECT,
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
