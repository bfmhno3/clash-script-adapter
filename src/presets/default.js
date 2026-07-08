/**
 * 默认方案入口（6 核心地区，无 TUN）
 * 构建产物：clash_verge_rev.min.js
 */
import { LOGGING_ENABLED, features } from '../features/default.js';
import { detectPlatform } from '../modules/platform.js';
import { getRegionProxies } from '../modules/regions.js';
import { buildProxyGroups } from '../modules/proxy-groups.js';
import { buildRules } from '../modules/rules.js';
import { buildDnsConfig } from '../modules/dns.js';
import { buildGlobalSettings, buildRuleProviders } from '../modules/global-settings.js';
import { buildSnifferConfig } from '../modules/network.js';
import { createLogger } from '../modules/logger.js';

function main(config, profilename, rulesetPath) {
  const platform = detectPlatform(profilename);
  const proxyNames = (config.proxies || []).map(p => p.name);
  const safeProxies = proxyNames.length > 0 ? proxyNames : ['DIRECT'];
  const regions = getRegionProxies(safeProxies);
  const logger = LOGGING_ENABLED ?
    createLogger('preset.default', features.logging) :
    null;

  if (logger && proxyNames.length === 0) {
    logger.warn('empty-proxies-fallback', { platform, proxyCount: proxyNames.length });
  }

  Object.assign(config, buildGlobalSettings(platform));
  config.dns = buildDnsConfig();
  config['rule-providers'] = buildRuleProviders(rulesetPath);
  config['proxy-groups'] = buildProxyGroups(regions, safeProxies, features);
  config.rules = buildRules(features, platform);
  config.sniffer = buildSnifferConfig();

  if (logger) {
    logger.info('config-generated', {
      groupCount: config['proxy-groups'].length,
      platform,
      proxyCount: proxyNames.length,
      ruleCount: config.rules.length,
      sniffer: true,
    });
    logger.debug('feature-summary', {
      ai: features.proxyGroups.ai,
      gaming: features.proxyGroups.gaming,
      social: features.proxyGroups.social,
      special: features.proxyGroups.special,
      streaming: features.proxyGroups.streaming,
    });
  }

  return config;
}

export { main };
