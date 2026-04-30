import { features } from '../features/full.js';
import { detectPlatform } from '../modules/platform.js';
import { getRegionProxies } from '../modules/regions.js';
import { buildProxyGroups } from '../modules/proxy-groups.js';
import { buildRules } from '../modules/rules.js';
import { buildDnsConfig } from '../modules/dns.js';
import { buildGlobalSettings, buildRuleProviders } from '../modules/global-settings.js';
import { buildTunConfig, buildSnifferConfig } from '../modules/network.js';

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
  config.tun = buildTunConfig(platform);
  config.sniffer = buildSnifferConfig();

  return config;
}

export { main };
