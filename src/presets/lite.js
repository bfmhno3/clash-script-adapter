/**
 * 轻量方案入口（3 精简地区，无 TUN，无 Sniffer）
 * 构建产物：clash_verge_rev_lite.min.js
 */
import { LOGGING_ENABLED, features } from '../features/lite.js';
import { detectPlatform } from '../modules/platform.js';
import { getRegionProxies } from '../modules/regions.js';
import { buildProxyGroups } from '../modules/proxy-groups.js';
import { buildRules } from '../modules/rules.js';
import { buildDnsConfig } from '../modules/dns.js';
import { buildGlobalSettings, buildRuleProviders } from '../modules/global-settings.js';
import { createLogger } from '../modules/logger.js';

function main(config, profilename, rulesetPath) {
  const platform = detectPlatform(profilename);
  const proxyNames = (config.proxies || []).map(p => p.name);
  const safeProxies = proxyNames.length > 0 ? proxyNames : ['DIRECT'];
  const regions = getRegionProxies(safeProxies);
  const logger = LOGGING_ENABLED ?
    createLogger('preset.lite', features.logging) :
    null;

  if (logger && proxyNames.length === 0) {
    logger.warn('empty-proxies-fallback', { platform, proxyCount: proxyNames.length });
  }

  Object.assign(config, buildGlobalSettings(platform));
  config.dns = buildDnsConfig();
  config['rule-providers'] = buildRuleProviders(rulesetPath);
  config['proxy-groups'] = buildProxyGroups(regions, safeProxies, features);
  config.rules = buildRules(features, platform);

  if (logger) {
    logger.info('config-generated', {
      groupCount: config['proxy-groups'].length,
      platform,
      proxyCount: proxyNames.length,
      ruleCount: config.rules.length,
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
