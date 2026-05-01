// 各地区代理名称匹配正则
// 匹配规则：国旗 emoji、中文地名、英文地名、IATA 机场代码、节点编号格式（如 HK01、HK-abc）
// 来源：Aethersailor/Custom_OpenClash_Rules 项目，按机场常见命名习惯整理
const REGEX = {
  hk: /(🇭🇰|港|\bHK(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|hk|Hong Kong|HongKong|hongkong|HONG KONG|HONGKONG|深港|HKG|九龙|Kowloon|新界|沙田|荃湾|葵涌)/i,
  us: /(🇺🇸|美|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|纽约|纽纽|亚特兰大|迈阿密|华盛顿|\bUS(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|United States|UnitedStates|UNITED STATES|USA|America|AMERICA|JFK|EWR|IAD|ATL|ORD|MIA|NYC|LAX|SFO|SEA|DFW|SJC)/i,
  jp: /(🇯🇵|日本|川日|东京|大阪|泉日|埼玉|沪日|深日|(?<!尼|-)日|\bJP(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|Japan|JAPAN|JPN|NRT|HND|KIX|TYO|OSA|关西|Kansai|KANSAI)/i,
  sg: /(🇸🇬|新加坡|坡|狮城|\bSG(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|Singapore|SINGAPORE|SIN)/i,
  tw: /(🇹🇼|🇼🇸|台|新北|彰化|\bTW(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|Taiwan|TAIWAN|TWN|TPE|ROC)/i,
  kr: /(🇰🇷|\bKR(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|Korea|KOREA|KOR|首尔|韩|韓|春川|Chuncheon|ICN)/i,
  ca: /(🇨🇦|加拿大|\bCA(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|Canada|CANADA|CAN|渥太华|温哥华|卡尔加里|蒙特利尔|Montreal|YVR|YYZ|YUL)/i,
  gb: /(🇬🇧|英国|Britain|United Kingdom|UNITED KINGDOM|England|伦敦|曼彻斯特|Manchester|\bUK(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|GBR|LHR|MAN)/i,
  fr: /(🇫🇷|法国|\bFR(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|France|FRANCE|FRA|巴黎|马赛|Marseille|CDG|MRS)/i,
  de: /(🇩🇪|德国|Germany|GERMANY|\bDE(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|DEU|柏林|法兰克福|慕尼黑|Munich|MUC)/i,
  nl: /(🇳🇱|荷兰|Netherlands|NETHERLANDS|\bNL(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|NLD|阿姆斯特丹|AMS)/i,
  tr: /(🇹🇷|土耳其|Turkey|TURKEY|Türkiye|\bTR(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|TUR|IST|ANK)/i,
  ru: /(🇷🇺|(?<!白)俄罗斯|(?<!白)俄|莫斯科|圣彼得堡|新西伯利亚|海参崴|符拉迪沃斯托克|哈巴罗夫斯克|伯力|\bRU(?:[-_ ]?\d+)?\b|Russia)/i,
  home: /(家宽|家庭宽带|住宅|Residential)/i,
  low: /(低倍率|低倍|(?<![\d\.])0?\.\d+(?![0-9])(?:x|倍)?|倍率[:： ]?0?\.\d+)/i,
};

// "其他地区"排除正则：动态拼接所有已知地区正则，用于反向匹配不属于任何已知地区的节点
const OTHER_EXCLUDE = new RegExp(
  Object.values(REGEX).map(r => r.source).join('|'),
  'i'
);

// 匹配代理名称，无匹配时返回 ['DIRECT'] 防止核心报空组错误
function getProxies(regex, proxyNames) {
  const matched = proxyNames.filter(name => regex.test(name));
  return matched.length > 0 ? matched : ['DIRECT'];
}

/**
 * Classify proxy names into 16 region groups.
 * @param {string[]} proxyNames
 * @returns {Object} Region-keyed proxy lists. Unmatched regions fall back to ['DIRECT'].
 */
export function getRegionProxies(proxyNames) {
  return {
    hk: getProxies(REGEX.hk, proxyNames),
    us: getProxies(REGEX.us, proxyNames),
    jp: getProxies(REGEX.jp, proxyNames),
    sg: getProxies(REGEX.sg, proxyNames),
    tw: getProxies(REGEX.tw, proxyNames),
    kr: getProxies(REGEX.kr, proxyNames),
    ca: getProxies(REGEX.ca, proxyNames),
    gb: getProxies(REGEX.gb, proxyNames),
    fr: getProxies(REGEX.fr, proxyNames),
    de: getProxies(REGEX.de, proxyNames),
    nl: getProxies(REGEX.nl, proxyNames),
    tr: getProxies(REGEX.tr, proxyNames),
    ru: getProxies(REGEX.ru, proxyNames),
    other: getProxies(
      new RegExp('^(?!.*(' + OTHER_EXCLUDE.source + ')).*', 'i'),
      proxyNames
    ),
    home: getProxies(REGEX.home, proxyNames),
    low: getProxies(REGEX.low, proxyNames),
  };
}
