import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { features as defaultFeatures } from '../src/features/default.js';
import { features as fullFeatures } from '../src/features/full.js';
import { buildDnsConfig } from '../src/modules/dns.js';
import { buildGlobalSettings, buildRuleProviders } from '../src/modules/global-settings.js';
import { buildSnifferConfig, buildTunConfig } from '../src/modules/network.js';
import { detectPlatform } from '../src/modules/platform.js';
import { buildProxyGroups } from '../src/modules/proxy-groups.js';
import { getRegionProxies } from '../src/modules/regions.js';
import { buildRules } from '../src/modules/rules.js';

function createSpyLogger() {
  const calls = [];
  const push = level => (event, context = {}) => calls.push({ level, event, context });

  return {
    calls,
    logger: {
      trace: push('trace'),
      debug: push('debug'),
      info: push('info'),
      warn: push('warn'),
      error: push('error'),
    },
  };
}

function findCall(calls, event) {
  return calls.find(call => call.event === event);
}

function withoutNavigator(fn) {
  const origDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    value: undefined, configurable: true, writable: true,
  });

  try {
    return fn();
  } finally {
    if (origDesc) Object.defineProperty(globalThis, 'navigator', origDesc);
  }
}

describe('module logging', () => {
  it('logs platform detection source and result', () => {
    const { calls, logger } = createSpyLogger();

    const platform = withoutNavigator(() => detectPlatform('profile_linux', logger));

    assert.equal(platform, 'linux');
    assert.deepEqual(findCall(calls, 'platform-detected'), {
      level: 'debug',
      event: 'platform-detected',
      context: { platform: 'linux', source: 'profilename' },
    });
  });

  it('logs region classification counts without proxy names', () => {
    const { calls, logger } = createSpyLogger();

    getRegionProxies(['HK01-private', 'US01-secret'], logger);

    const call = findCall(calls, 'regions-classified');
    assert.equal(call.level, 'info');
    assert.equal(call.context.inputCount, 2);
    assert.equal(call.context.hkCount, 1);
    assert.equal(call.context.usCount, 1);
    assert.deepEqual(
      JSON.stringify(call.context).includes('HK01-private') ||
        JSON.stringify(call.context).includes('US01-secret'),
      false
    );
  });

  it('logs rules and proxy group summaries without proxy names', () => {
    const rulesLogger = createSpyLogger();
    const rules = buildRules(fullFeatures, 'windows', rulesLogger.logger);
    const rulesCall = findCall(rulesLogger.calls, 'rules-built');

    assert.equal(rulesCall.level, 'info');
    assert.equal(rulesCall.context.platform, 'windows');
    assert.equal(rulesCall.context.ruleCount, rules.length);
    assert.equal(rulesCall.context.processRuleCount, 2);

    const groupLogger = createSpyLogger();
    const regions = getRegionProxies(['HK01-private', 'US01-secret']);
    const groups = buildProxyGroups(regions, ['HK01-private', 'US01-secret'], fullFeatures, groupLogger.logger);
    const groupsCall = findCall(groupLogger.calls, 'proxy-groups-built');

    assert.equal(groupsCall.level, 'info');
    assert.equal(groupsCall.context.groupCount, groups.length);
    assert.equal(groupsCall.context.prunedRegionGroupCount, 14);
    assert.equal(groupsCall.context.safeProxyCount, 2);
    assert.equal(JSON.stringify(groupsCall.context).includes('HK01-private'), false);
    assert.equal(JSON.stringify(groupsCall.context).includes('US01-secret'), false);
  });

  it('logs dns, global settings, provider, tun, and sniffer summaries', () => {
    const { calls, logger } = createSpyLogger();
    const rules = buildRules(defaultFeatures, 'linux');

    const dns = buildDnsConfig(logger);
    buildGlobalSettings('linux', logger);
    const providers = buildRuleProviders('./rulesets', rules, logger);
    buildTunConfig('linux', logger);
    buildSnifferConfig(logger);

    assert.equal(findCall(calls, 'dns-built').context.fakeIpFilterCount, dns['fake-ip-filter'].length);
    assert.equal(findCall(calls, 'global-settings-built').context.routingMark, true);
    assert.equal(findCall(calls, 'rule-providers-built').context.providerCount, Object.keys(providers).length);
    assert.equal(findCall(calls, 'tun-built').context.autoRedirect, true);
    assert.equal(findCall(calls, 'sniffer-built').context.sniffProtocolCount, 3);
  });
});
