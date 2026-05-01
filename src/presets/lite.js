/**
 * 轻量方案入口（3 精简地区，无 TUN，无 Sniffer）
 * 构建产物：clash_verge_rev_lite.min.js
 */
import { features } from '../features/lite.js';
import { detectPlatform } from '../modules/platform.js';
import { getRegionProxies } from '../modules/regions.js';
import { buildProxyGroups } from '../modules/proxy-groups.js';
import { buildRules } from '../modules/rules.js';
import { buildDnsConfig } from '../modules/dns.js';
import { buildGlobalSettings, buildRuleProviders } from '../modules/global-settings.js';

function main(config, profilename) {
  const platform = detectPlatform(profilename);
  const proxyNames = (config.proxies || []).map(p => p.name);
  const safeProxies = proxyNames.length > 0 ? proxyNames : ['DIRECT'];
  const regions = getRegionProxies(safeProxies);

  Object.assign(config, buildGlobalSettings(platform));
  config.dns = buildDnsConfig();
  config['rule-providers'] = buildRuleProviders();
  config['proxy-groups'] = buildProxyGroups(regions, safeProxies, features);
  config.rules = buildRules(features);

  return config;
}

export { main };
