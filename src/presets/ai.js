/**
 * AI 方案入口（国内直连 + 固定单节点出口，含 TUN + Sniffer）
 * 构建产物：ai.min.js
 */
import { DNS_STRICT, LOGGING_ENABLED, features } from '../features/ai.js';
import { detectPlatform } from '../modules/platform.js';
import { cleanProxies } from '../modules/proxy-cleaner.js';
import { getRegionProxies } from '../modules/regions.js';
import { buildProxyGroups } from '../modules/proxy-groups.js';
import { buildRules } from '../modules/rules.js';
import { buildDnsConfig, buildStrictDnsConfig } from '../modules/dns.js';
import { buildGlobalSettings, buildRuleProviders } from '../modules/global-settings.js';
import { applyNetworkFeatures } from '../modules/network.js';
import { createLogger } from '../modules/logger.js';

function main(config, profilename, rulesetPath) {
  const logger = LOGGING_ENABLED ?
    createLogger('preset.ai', features.logging) :
    null;
  const platform = detectPlatform(profilename, logger);
  const proxies = cleanProxies(config.proxies, logger);
  const proxyNames = proxies.map(proxy => proxy.name);
  if (Array.isArray(config.proxies)) {
    config.proxies = proxies;
  }
  const safeProxies = proxyNames.length > 0 ? proxyNames : ['DIRECT'];
  const regions = getRegionProxies(safeProxies, logger);

  if (logger && proxyNames.length === 0) {
    logger.warn('empty-proxies-fallback', { platform, proxyCount: proxyNames.length });
  }

  const rules = buildRules(features, platform, logger);

  Object.assign(config, buildGlobalSettings(platform, logger));
  config.dns = DNS_STRICT ?
    buildStrictDnsConfig(logger) :
    buildDnsConfig(logger);
  config['rule-providers'] = buildRuleProviders(rulesetPath, rules, logger);
  config['proxy-groups'] = buildProxyGroups(regions, safeProxies, features, logger);
  config.rules = rules;
  applyNetworkFeatures(config, features, platform, logger);

  if (logger) {
    logger.info('config-generated', {
      groupCount: config['proxy-groups'].length,
      platform,
      proxyCount: proxyNames.length,
      ntp: features.ntp,
      ruleCount: config.rules.length,
      sniffer: features.sniffer,
      stableEgress: true,
      tun: features.tun,
    });
    logger.debug('feature-summary', {
      dnsStrict: features.dns.strict,
      stableEgress: features.proxyGroups.stableEgress,
    });
  }

  return config;
}

export { main };
