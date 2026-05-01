/**
 * 构建全局基础配置，根据平台适配部分参数。
 * @param {'windows'|'macos'|'linux'|'android'|'unknown'} platform
 */
export function buildGlobalSettings(platform) {
  const config = {
    authentication: ['user1:pass1', 'user2:pass2'],
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
      asn: 'https://github.com/xishang0128/geoip/releases/download/latest/GeoLite2-ASN.mmdb',
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
 * 从 Aethersailor 远程仓库动态加载规则集，支持自动更新（interval 8 小时）。
 */
export function buildRuleProviders() {
  return {
    'Custom_Direct_Domain': {
      type: 'http',
      behavior: 'domain',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Direct_Domain.yaml',
      path: './rulesets/Custom_Direct_Domain.yaml',
      interval: 28800,
    },
    'Custom_Direct_Classical_IP': {
      type: 'http',
      behavior: 'classical',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Direct_Classical_IP.yaml',
      path: './rulesets/Custom_Direct_Classical_IP.yaml',
      interval: 28800,
    },
    'Custom_Proxy_Domain': {
      type: 'http',
      behavior: 'domain',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Proxy_Domain.yaml',
      path: './rulesets/Custom_Proxy_Domain.yaml',
      interval: 28800,
    },
    'Custom_Proxy_Classical_IP': {
      type: 'http',
      behavior: 'classical',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Proxy_Classical_IP.yaml',
      path: './rulesets/Custom_Proxy_Classical_IP.yaml',
      interval: 28800,
    },
    'Steam_CDN_Classical': {
      type: 'http',
      behavior: 'classical',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Steam_CDN_Classical.yaml',
      path: './rulesets/Steam_CDN_Classical.yaml',
      interval: 28800,
    },
    'Custom_Port_Direct': {
      type: 'http',
      behavior: 'classical',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Port_Direct.yaml',
      path: './rulesets/Custom_Port_Direct.yaml',
      interval: 28800,
    },
  };
}
