/**
 * 构建全局基础配置，根据平台适配部分参数。
 * @param {'windows'|'macos'|'linux'|'android'|'unknown'} platform
 */
export function buildGlobalSettings(platform, logger = null) {
  const config = {
    authentication: [],
    'skip-auth-prefixes': ['127.0.0.1/8', '::1/28'],
    mode: 'rule',                    // 规则匹配模式（非 global/direct）
    'keep-alive-interval': 15,
    'keep-alive-idle': 60,
    'disable-keep-alive': platform === 'android' ? true : true,  // Android 强制禁用
    'find-process-mode': platform === 'android' ? 'off' : 'strict',
    'external-controller-cors': {
      'allow-origins': ['*'],
      'allow-private-network': true,
    },
    secret: '',
    profile: {
      'store-selected': true,     // 缓存策略组选择，下次启动沿用
      'store-fake-ip': true,      // 缓存 fake-ip 映射，域名重连时复用
    },
    'unified-delay': true,        // 统一延迟计算（消除握手差异）
    'tcp-concurrent': true,       // TCP 并发连接（多 IP 时用最快的）
    ipv6: true,                   // Enable IPv6 so AAAA-derived connections are usable
    'geodata-mode': true,         // 使用 dat 格式 geoip（非 mmdb）
    'geodata-loader': 'standard', // 标准加载器（非 memconservative）
    'geo-auto-update': true,
    'geo-update-interval': 24,
    'geo-url': {
      geoip: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat',
      geosite: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat',
      mmdb: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb',
      asn: 'https://gh-proxy.com/https://github.com/xishang0128/geoip/releases/download/latest/GeoLite2-ASN.mmdb',
    },
    'global-ua': 'clash.meta',
    'etag-support': true,
  };

  // routing-mark 仅在 Linux 下有意义（配合 iptables/nftables 策略路由）
  if (platform === 'linux' || platform === 'unknown') {
    config['routing-mark'] = 6666;
  }

  if (logger) {
    logger.info('global-settings-built', {
      findProcessMode: config['find-process-mode'],
      geoAutoUpdate: config['geo-auto-update'],
      ipv6: config.ipv6,
      platform,
      routingMark: Object.prototype.hasOwnProperty.call(config, 'routing-mark'),
      tcpConcurrent: config['tcp-concurrent'],
      unifiedDelay: config['unified-delay'],
    });
  }

  return config;
}

/**
 * 构建规则提供者（Rule Providers）配置。
 * 聚合多个远程规则仓库，支持自动更新（interval 8 小时）。
 * @param {string} [rulesetPath='./rulesets'] - 规则集文件存储路径
 */
export function buildRuleProviders(rulesetPath = './rulesets', rules = null, logger = null) {
  const interval = 28800;
  const GITHUB_RAW = 'https://raw.githubusercontent.com/';
  const JSDELIVR_GH = 'https://testingcf.jsdelivr.net/gh/';
  const gh = url => {
    if (!url.startsWith(GITHUB_RAW)) return url;

    const parts = url.slice(GITHUB_RAW.length).split('/');
    const owner = parts[0];
    const repo = parts[1];
    const branch = parts[2] === 'refs' && parts[3] === 'heads' ?
      parts[4] :
      parts[2];
    const pathIndex = parts[2] === 'refs' && parts[3] === 'heads' ? 5 : 3;
    const filePath = parts.slice(pathIndex).join('/');
    return `${JSDELIVR_GH}${owner}/${repo}@${branch}/${filePath}`;
  };
  const rp = name => `${rulesetPath}/${name}`;

  const domain = (url, path) => ({
    type: 'http',
    behavior: 'domain',
    format: 'mrs',
    url,
    path,
    interval,
  });

  const ip = (url, path) => ({
    type: 'http',
    behavior: 'ipcidr',
    format: 'mrs',
    url,
    path,
    interval,
  });

  const getClassicalFormat = path => path.endsWith('.list') ? 'text' : 'yaml';
  const classical = (url, path) => ({
    type: 'http',
    behavior: 'classical',
    format: getClassicalFormat(path),
    url,
    path,
    interval,
  });

  const providers = {
    giveup_direct: classical(
      gh('https://raw.githubusercontent.com/Giveupmoon/Clash_Rules_Yaml/refs/heads/main/Rules/Giveup_Direct.list'),
      rp('giveup_direct.list')
    ),
    giveup_proxy: classical(
      gh('https://raw.githubusercontent.com/Giveupmoon/Clash_Rules_Yaml/refs/heads/main/Rules/Giveup_Proxy.list'),
      rp('giveup_proxy.list')
    ),

    private: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.mrs'),
      rp('private.mrs')
    ),
    private_IP: ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/private.mrs'),
      rp('private_IP.mrs')
    ),

    Custom_Direct_Domain: domain(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Direct_Domain.mrs'),
      rp('Custom_Direct_Domain.mrs')
    ),
    Custom_Direct_IP: ip(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Direct_IP.mrs'),
      rp('Custom_Direct_IP.mrs')
    ),
    Custom_Proxy_Domain: domain(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Proxy_Domain.mrs'),
      rp('Custom_Proxy_Domain.mrs')
    ),
    Custom_Proxy_IP: ip(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Proxy_IP.mrs'),
      rp('Custom_Proxy_IP.mrs')
    ),

    'google-cn': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google-cn.mrs'),
      rp('google-cn.mrs')
    ),
    'category-games@cn': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-games@cn.mrs'),
      rp('category-games@cn.mrs')
    ),

    Steam_CDN_Domain: domain(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Steam_CDN_Domain.mrs'),
      rp('Steam_CDN_Domain.mrs')
    ),
    Steam_CDN_IP: ip(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Steam_CDN_IP.mrs'),
      rp('Steam_CDN_IP.mrs')
    ),

    'category-game-platforms-download': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-game-platforms-download.mrs'),
      rp('category-game-platforms-download.mrs')
    ),
    'category-public-tracker': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-public-tracker.mrs'),
      rp('category-public-tracker.mrs')
    ),
    'category-communication': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-communication.mrs'),
      rp('category-communication.mrs')
    ),
    'category-social-media': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-social-media-!cn.mrs'),
      rp('category-social-media.mrs')
    ),

    openai: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/openai.mrs'),
      rp('openai.mrs')
    ),
    'google-gemini': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google-gemini.mrs'),
      rp('google-gemini.mrs')
    ),
    'category-ai': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ai-!cn.mrs'),
      rp('category-ai.mrs')
    ),
    github: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/github.mrs'),
      rp('github.mrs')
    ),
    'category-speedtest': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-speedtest.mrs'),
      rp('category-speedtest.mrs')
    ),
    steam: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/steam.mrs'),
      rp('steam.mrs')
    ),

    youtube: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/youtube.mrs'),
      rp('youtube.mrs')
    ),
    'apple-tvplus': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple-tvplus.mrs'),
      rp('apple-tvplus.mrs')
    ),
    apple: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple.mrs'),
      rp('apple.mrs')
    ),
    microsoft: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft.mrs'),
      rp('microsoft.mrs')
    ),
    google: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google.mrs'),
      rp('google.mrs')
    ),
    tiktok: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/tiktok.mrs'),
      rp('tiktok.mrs')
    ),
    netflix: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/netflix.mrs'),
      rp('netflix.mrs')
    ),
    disney: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/disney.mrs'),
      rp('disney.mrs')
    ),
    hbo: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/hbo.mrs'),
      rp('hbo.mrs')
    ),
    primevideo: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/primevideo.mrs'),
      rp('primevideo.mrs')
    ),
    'category-emby': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-emby.mrs'),
      rp('category-emby.mrs')
    ),
    spotify: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/spotify.mrs'),
      rp('spotify.mrs')
    ),
    bahamut: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/bahamut.mrs'),
      rp('bahamut.mrs')
    ),
    'category-games': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-games.mrs'),
      rp('category-games.mrs')
    ),
    'category-entertainment': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-entertainment.mrs'),
      rp('category-entertainment.mrs')
    ),
    gfw: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/gfw.mrs'),
      rp('gfw.mrs')
    ),

    telegram: ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/telegram.mrs'),
      rp('telegram.mrs')
    ),
    twitter: ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/twitter.mrs'),
      rp('twitter.mrs')
    ),
    facebook: ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/facebook.mrs'),
      rp('facebook.mrs')
    ),
    'google-ip': ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/google.mrs'),
      rp('google-ip.mrs')
    ),
    'netflix-ip': ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/netflix.mrs'),
      rp('netflix-ip.mrs')
    ),
    cn: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.mrs'),
      rp('cn.mrs')
    ),
    'cn-ip': ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.mrs'),
      rp('cn-ip.mrs')
    ),
    PayPal: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/paypal.mrs'),
      rp('PayPal.mrs')
    ),

    // 兼容现有规则命名（避免旧规则立即失效）
    Custom_Direct_Classical_IP: classical(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Direct_IP.yaml'),
      rp('Custom_Direct_Classical_IP.yaml')
    ),
    Custom_Proxy_Classical_IP: classical(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Proxy_IP.yaml'),
      rp('Custom_Proxy_Classical_IP.yaml')
    ),
    Steam_CDN_Classical: classical(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Steam_CDN_Classical.yaml'),
      rp('Steam_CDN_Classical.yaml')
    ),
    Custom_Port_Direct: classical(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Port_Direct.yaml'),
      rp('Custom_Port_Direct.yaml')
    ),
  };

  const usedNames = rules ?
    rules
      .filter(rule => rule.startsWith('RULE-SET,'))
      .map(rule => rule.split(',')[1]) :
    [];
  const result = !rules ? providers : Object.keys(providers).reduce((filteredProviders, name) => (
    usedNames.includes(name) ? { ...filteredProviders, [name]: providers[name] } : filteredProviders
  ), {});

  if (logger) {
    logger.info('rule-providers-built', {
      filtered: Boolean(rules),
      providerCount: Object.keys(result).length,
      rulesetPathProvided: Boolean(rulesetPath),
      totalProviderCount: Object.keys(providers).length,
    });
  }

  return result;
}
