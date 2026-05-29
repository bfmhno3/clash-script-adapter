/**
 * 构建全局基础配置，根据平台适配部分参数。
 * @param {'windows'|'macos'|'linux'|'android'|'unknown'} platform
 */
export function buildGlobalSettings(platform) {
  const config = {
    authentication: [],
    'skip-auth-prefixes': ['127.0.0.1/8', '::1/28'],
    mode: 'rule',                    // 规则匹配模式（非 global/direct）
    'keep-alive-interval': 15,
    'keep-alive-idle': 60,
    'disable-keep-alive': platform === 'android' ? true : true,  // Android 强制禁用
    'find-process-mode': platform === 'android' ? 'off' : 'strict',  // Android 关闭进程匹配
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

  return config;
}

/**
 * 构建规则提供者（Rule Providers）配置。
 * 聚合多个远程规则仓库，支持自动更新（interval 8 小时）。
 */
export function buildRuleProviders() {
  const interval = 28800;
  const GH_PROXY = 'https://gh-proxy.com/';
  const gh = url => GH_PROXY + url;

  const domain = (url, path) => ({
    type: 'http',
    behavior: 'domain',
    url,
    path,
    interval,
  });

  const ip = (url, path) => ({
    type: 'http',
    behavior: 'ipcidr',
    url,
    path,
    interval,
  });

  const classical = (url, path) => ({
    type: 'http',
    behavior: 'classical',
    url,
    path,
    interval,
  });

  return {
    giveup_direct: classical(
      gh('https://raw.githubusercontent.com/Giveupmoon/Clash_Rules_Yaml/refs/heads/main/Rules/Giveup_Direct.list'),
      './rulesets/giveup_direct.list'
    ),
    giveup_proxy: classical(
      gh('https://raw.githubusercontent.com/Giveupmoon/Clash_Rules_Yaml/refs/heads/main/Rules/Giveup_Proxy.list'),
      './rulesets/giveup_proxy.list'
    ),

    private: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.mrs'),
      './rulesets/private.mrs'
    ),
    private_IP: ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/private.mrs'),
      './rulesets/private_IP.mrs'
    ),

    Custom_Direct_Domain: domain(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Direct_Domain.mrs'),
      './rulesets/Custom_Direct_Domain.mrs'
    ),
    Custom_Direct_IP: ip(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Direct_IP.mrs'),
      './rulesets/Custom_Direct_IP.mrs'
    ),
    Custom_Proxy_Domain: domain(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Proxy_Domain.mrs'),
      './rulesets/Custom_Proxy_Domain.mrs'
    ),
    Custom_Proxy_IP: ip(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Proxy_IP.mrs'),
      './rulesets/Custom_Proxy_IP.mrs'
    ),

    'google-cn': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google-cn.mrs'),
      './rulesets/google-cn.mrs'
    ),
    'category-games@cn': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-games@cn.mrs'),
      './rulesets/category-games@cn.mrs'
    ),

    Steam_CDN_Domain: domain(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Steam_CDN_Domain.mrs'),
      './rulesets/Steam_CDN_Domain.mrs'
    ),
    Steam_CDN_IP: ip(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Steam_CDN_IP.mrs'),
      './rulesets/Steam_CDN_IP.mrs'
    ),

    'category-game-platforms-download': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-game-platforms-download.mrs'),
      './rulesets/category-game-platforms-download.mrs'
    ),
    'category-public-tracker': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-public-tracker.mrs'),
      './rulesets/category-public-tracker.mrs'
    ),
    'category-communication': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-communication.mrs'),
      './rulesets/category-communication.mrs'
    ),
    'category-social-media': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-social-media-!cn.mrs'),
      './rulesets/category-social-media.mrs'
    ),

    openai: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/openai.mrs'),
      './rulesets/openai.mrs'
    ),
    'google-gemini': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google-gemini.mrs'),
      './rulesets/google-gemini.mrs'
    ),
    'category-ai': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ai-!cn.mrs'),
      './rulesets/category-ai.mrs'
    ),
    github: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/github.mrs'),
      './rulesets/github.mrs'
    ),
    'category-speedtest': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-speedtest.mrs'),
      './rulesets/category-speedtest.mrs'
    ),
    steam: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/steam.mrs'),
      './rulesets/steam.mrs'
    ),

    youtube: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/youtube.mrs'),
      './rulesets/youtube.mrs'
    ),
    'apple-tvplus': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple-tvplus.mrs'),
      './rulesets/apple-tvplus.mrs'
    ),
    apple: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple.mrs'),
      './rulesets/apple.mrs'
    ),
    microsoft: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft.mrs'),
      './rulesets/microsoft.mrs'
    ),
    google: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google.mrs'),
      './rulesets/google.mrs'
    ),
    tiktok: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/tiktok.mrs'),
      './rulesets/tiktok.mrs'
    ),
    netflix: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/netflix.mrs'),
      './rulesets/netflix.mrs'
    ),
    disney: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/disney.mrs'),
      './rulesets/disney.mrs'
    ),
    hbo: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/hbo.mrs'),
      './rulesets/hbo.mrs'
    ),
    primevideo: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/primevideo.mrs'),
      './rulesets/primevideo.mrs'
    ),
    'category-emby': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-emby.mrs'),
      './rulesets/category-emby.mrs'
    ),
    spotify: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/spotify.mrs'),
      './rulesets/spotify.mrs'
    ),
    bahamut: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/bahamut.mrs'),
      './rulesets/bahamut.mrs'
    ),
    'category-games': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-games.mrs'),
      './rulesets/category-games.mrs'
    ),
    'category-entertainment': domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-entertainment.mrs'),
      './rulesets/category-entertainment.mrs'
    ),
    gfw: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/gfw.mrs'),
      './rulesets/gfw.mrs'
    ),

    telegram: ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/telegram.mrs'),
      './rulesets/telegram.mrs'
    ),
    twitter: ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/twitter.mrs'),
      './rulesets/twitter.mrs'
    ),
    facebook: ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/facebook.mrs'),
      './rulesets/facebook.mrs'
    ),
    'google-ip': ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/google.mrs'),
      './rulesets/google-ip.mrs'
    ),
    'netflix-ip': ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/netflix.mrs'),
      './rulesets/netflix-ip.mrs'
    ),
    cn: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.mrs'),
      './rulesets/cn.mrs'
    ),
    'cn-ip': ip(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.mrs'),
      './rulesets/cn-ip.mrs'
    ),
    PayPal: domain(
      gh('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/paypal.mrs'),
      './rulesets/PayPal.mrs'
    ),

    // 兼容现有规则命名（避免旧规则立即失效）
    Custom_Direct_Classical_IP: classical(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Direct_IP.yaml'),
      './rulesets/Custom_Direct_Classical_IP.yaml'
    ),
    Custom_Proxy_Classical_IP: classical(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Proxy_IP.yaml'),
      './rulesets/Custom_Proxy_Classical_IP.yaml'
    ),
    Steam_CDN_Classical: classical(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Steam_CDN_Classical.yaml'),
      './rulesets/Steam_CDN_Classical.yaml'
    ),
    Custom_Port_Direct: classical(
      gh('https://raw.githubusercontent.com/Aethersailor/Custom_OpenClash_Rules/main/rule/Custom_Port_Direct.yaml'),
      './rulesets/Custom_Port_Direct.yaml'
    ),
  };
}
