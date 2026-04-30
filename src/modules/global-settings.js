export function buildGlobalSettings(platform) {
  const config = {
    authentication: ['user1:pass1', 'user2:pass2'],
    'skip-auth-prefixes': ['127.0.0.1/8', '::1/28'],
    mode: 'rule',
    'keep-alive-interval': 15,
    'keep-alive-idle': 60,
    'disable-keep-alive': platform === 'android' ? true : true,
    'find-process-mode': platform === 'android' ? 'off' : 'strict',
    'external-controller-cors': {
      'allow-origins': ['*'],
      'allow-private-network': true,
    },
    secret: '',
    profile: {
      'store-selected': true,
      'store-fake-ip': true,
    },
    'unified-delay': true,
    'tcp-concurrent': true,
    'geodata-mode': true,
    'geodata-loader': 'standard',
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

  // routing-mark only meaningful on Linux
  if (platform === 'linux' || platform === 'unknown') {
    config['routing-mark'] = 6666;
  }

  return config;
}

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
