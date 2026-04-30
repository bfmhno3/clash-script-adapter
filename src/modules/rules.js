import { GROUP } from './proxy-groups.js';

const BASIC_RULES = [
  'GEOSITE,private,' + GROUP.DIRECT,
  'GEOIP,private,' + GROUP.DIRECT + ',no-resolve',
  'RULE-SET,Custom_Direct_Domain,' + GROUP.DIRECT,
  'RULE-SET,Custom_Direct_Classical_IP,' + GROUP.DIRECT,
  'RULE-SET,Custom_Proxy_Domain,' + GROUP.MANUAL,
  'RULE-SET,Custom_Proxy_Classical_IP,' + GROUP.MANUAL,
  'GEOSITE,google-cn,' + GROUP.DIRECT,
  'GEOSITE,category-games@cn,' + GROUP.DIRECT,
  'RULE-SET,Steam_CDN_Classical,' + GROUP.DIRECT,
  'GEOSITE,category-game-platforms-download,' + GROUP.DIRECT,
  'GEOSITE,category-public-tracker,' + GROUP.DIRECT,
];

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

const AI_RULES = [
  'GEOSITE,openai,' + GROUP.CHATGPT,
  'GEOSITE,category-ai-!cn,' + GROUP.AI,
];

const SOCIAL_RULES = [
  'GEOSITE,category-communication,' + GROUP.IM,
  'GEOSITE,category-social-media-!cn,' + GROUP.SOCIAL,
  'GEOSITE,github,' + GROUP.GITHUB,
  'GEOSITE,category-speedtest,' + GROUP.SPEEDTEST,
  'GEOSITE,tiktok,' + GROUP.TIKTOK,
  'GEOSITE,apple,' + GROUP.APPLE,
  'GEOSITE,microsoft,' + GROUP.MICROSOFT,
  'GEOSITE,googlefcm,' + GROUP.FCM,
  'GEOSITE,google,' + GROUP.GOOGLE,
  'GEOSITE,category-entertainment,' + GROUP.MEDIA,
  'GEOSITE,category-ecommerce,' + GROUP.ECOMMERCE,
  'GEOSITE,gfw,' + GROUP.MANUAL,
  'GEOIP,telegram,' + GROUP.IM + ',no-resolve',
  'GEOIP,twitter,' + GROUP.SOCIAL + ',no-resolve',
  'GEOIP,facebook,' + GROUP.SOCIAL + ',no-resolve',
  'GEOIP,google,' + GROUP.GOOGLE + ',no-resolve',
  'GEOIP,netflix,' + GROUP.NETFLIX + ',no-resolve',
];

const GAMING_RULES = [
  'GEOSITE,steam,' + GROUP.STEAM,
  'GEOSITE,category-games,' + GROUP.GAMING,
];

const SPECIAL_RULES = [
  'GEOSITE,talkatone,' + GROUP.TALKATONE,
  'GEOSITE,onedrive,' + GROUP.ONEDRIVE,
  'GEOSITE,bing,' + GROUP.COPILOT,
  'GEOSITE,category-pt,' + GROUP.PT,
  'GEOSITE,paypal,' + GROUP.PAYPAL,
];

const PROCESS_RULES = [
  'PROCESS-NAME,com.android.captiveportallogin,' + GROUP.DIRECT,
  'PROCESS-NAME,com.android.chrome,' + GROUP.MANUAL,
  'PROCESS-NAME,chrome.exe,' + GROUP.MANUAL,
  'PROCESS-NAME,firefox.exe,' + GROUP.MANUAL,
  'PROCESS-NAME,safari,' + GROUP.MANUAL,
];

const TAIL_RULES = [
  'GEOSITE,cn,' + GROUP.DIRECT,
  'GEOIP,cn,' + GROUP.DIRECT + ',no-resolve',
  'RULE-SET,Custom_Port_Direct,' + GROUP.NON_STD,
  'MATCH,' + GROUP.CATCH_ALL,
];

export function buildRules(features) {
  return [
    ...BASIC_RULES,
    ...(features.rules.streaming ? STREAMING_RULES : []),
    ...(features.rules.ai ? AI_RULES : []),
    ...(features.rules.social ? SOCIAL_RULES : []),
    ...(features.rules.gaming ? GAMING_RULES : []),
    ...(features.rules.special ? SPECIAL_RULES : []),
    ...(features.rules.process ? PROCESS_RULES : []),
    ...TAIL_RULES,
  ];
}
