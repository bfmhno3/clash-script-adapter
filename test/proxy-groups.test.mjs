import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { GROUP, buildProxyGroups } from '../src/modules/proxy-groups.js';

describe('GROUP constants', () => {
  it('contains all expected group names', () => {
    const expected = [
      'AUTO', 'MANUAL', 'DIRECT', 'STABLE', 'CATCH_ALL', 'NON_STD',
      'HK', 'US', 'JP', 'SG', 'TW', 'KR', 'CA', 'GB', 'FR', 'DE', 'NL', 'TR', 'RU',
      'OTHER', 'HOME', 'LOW',
      'IM', 'SOCIAL', 'TALKATONE', 'GITHUB', 'CHATGPT', 'COPILOT', 'AI',
      'TIKTOK', 'YOUTUBE', 'NETFLIX', 'DISNEY', 'HBO', 'PRIMEVIDEO', 'APPLETV',
      'EMBY', 'SPOTIFY', 'BAHAMUT', 'MEDIA', 'ECOMMERCE', 'FCM', 'GOOGLE', 'APPLE',
      'MICROSOFT', 'ONEDRIVE', 'PAYPAL', 'GAMING', 'STEAM', 'PT', 'SPEEDTEST',
    ];
    for (const key of expected) {
      assert.ok(GROUP[key] !== undefined, `GROUP.${key} should be defined`);
    }
  });

  it('uses English-only display names', () => {
    for (const value of Object.values(GROUP)) {
      assert.equal(/[\u4e00-\u9fff]/.test(value), false, `${value} contains Chinese text`);
    }
  });
});

const ALL_FEATURES_ON = {
  regions: {
    core: ['hk', 'us', 'jp', 'sg', 'tw', 'kr'],
    extended: ['ca', 'gb', 'fr', 'de', 'nl', 'tr', 'ru'],
    special: ['other', 'home', 'low'],
  },
  proxyGroups: {
    basic: true, regional: true, streaming: true, ai: true,
    social: true, gaming: true, special: true,
  },
};

const PRUNE_EMPTY_REGION_FEATURES = {
  ...ALL_FEATURES_ON,
  proxyGroups: {
    ...ALL_FEATURES_ON.proxyGroups,
    pruneEmptyRegions: true,
  },
};

const ALL_FEATURES_OFF = {
  regions: {
    core: ['hk', 'us', 'jp'],
    extended: [],
    special: [],
  },
  proxyGroups: {
    basic: true, regional: true, streaming: false, ai: false,
    social: false, gaming: false, special: false,
  },
};

const REGIONS_MAP = {
  hk: ['HK01', 'HK02'],
  us: ['US01'],
  jp: ['JP01'],
  sg: ['SG01'],
  tw: ['TW01'],
  kr: ['KR01'],
  ca: ['CA01'],
  gb: ['GB01'],
  fr: ['FR01'],
  de: ['DE01'],
  nl: ['NL01'],
  tr: ['TR01'],
  ru: ['RU01'],
  other: ['OTHER01'],
  home: ['HOME01'],
  low: ['LOW01'],
};

describe('buildProxyGroups', () => {
  it('always contains AUTO, DIRECT, MANUAL, CATCH_ALL, NON_STD', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_OFF);
    const names = groups.map(g => g.name);
    assert.ok(names.includes(GROUP.AUTO));
    assert.ok(names.includes(GROUP.DIRECT));
    assert.ok(names.includes(GROUP.MANUAL));
    assert.ok(names.includes(GROUP.CATCH_ALL));
    assert.ok(names.includes(GROUP.NON_STD));
  });

  it('generates more groups with all features on than off', () => {
    const onGroups = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_ON);
    const offGroups = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_OFF);
    assert.ok(onGroups.length > offGroups.length);
  });

  it('does not duplicate references within any group proxy list', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_ON);

    for (const group of groups) {
      const duplicateRefs = group.proxies.filter(
        (proxy, index, proxies) => proxies.indexOf(proxy) !== index
      );
      assert.deepEqual(duplicateRefs, [], `${group.name} has duplicate proxies`);
    }
  });

  it('streaming toggle controls Netflix/Disney/YouTube groups', () => {
    const on = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_ON);
    const off = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_OFF);
    const onNames = on.map(g => g.name);
    const offNames = off.map(g => g.name);
    assert.ok(onNames.includes(GROUP.NETFLIX));
    assert.ok(!offNames.includes(GROUP.NETFLIX));
    assert.ok(onNames.includes(GROUP.DISNEY));
    assert.ok(!offNames.includes(GROUP.DISNEY));
    assert.ok(onNames.includes(GROUP.YOUTUBE));
    assert.ok(!offNames.includes(GROUP.YOUTUBE));
  });

  it('ai toggle controls the unified AI Services selector', () => {
    const on = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_ON);
    const off = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_OFF);
    const onNames = on.map(g => g.name);
    const offNames = off.map(g => g.name);
    assert.ok(onNames.includes(GROUP.AI));
    assert.ok(!offNames.includes(GROUP.AI));
    assert.ok(!onNames.includes(GROUP.CHATGPT));
    assert.ok(!onNames.includes(GROUP.COPILOT));
    const ai = on.find(g => g.name === GROUP.AI);
    assert.equal(ai.type, 'select');
    assert.equal(ai.url, undefined);
    assert.equal(ai.interval, undefined);
    assert.deepEqual(ai.proxies.slice(0, 6), [
      GROUP.US,
      GROUP.SG,
      GROUP.JP,
      GROUP.HK,
      GROUP.MANUAL,
      GROUP.AUTO,
    ]);
  });

  it('AI Services skips unavailable preferred regions', () => {
    const groups = buildProxyGroups({
      ...REGIONS_MAP,
      us: ['DIRECT'],
      sg: [],
      jp: ['JP01'],
      hk: ['HK01'],
    }, ['HK01', 'JP01'], ALL_FEATURES_ON);
    const ai = groups.find(g => g.name === GROUP.AI);

    assert.deepEqual(ai.proxies.slice(0, 4), [
      GROUP.JP,
      GROUP.HK,
      GROUP.MANUAL,
      GROUP.AUTO,
    ]);
    assert.ok(!ai.proxies.includes(GROUP.US));
    assert.ok(!ai.proxies.includes(GROUP.SG));
  });

  it('YouTube defaults to Hong Kong then Japan', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_ON);
    const youtube = groups.find(g => g.name === GROUP.YOUTUBE);

    assert.deepEqual(youtube.proxies.slice(0, 6), [
      GROUP.HK,
      GROUP.JP,
      GROUP.SG,
      GROUP.TW,
      GROUP.MANUAL,
      GROUP.AUTO,
    ]);
  });

  it('YouTube skips unavailable preferred regions', () => {
    const groups = buildProxyGroups({
      ...REGIONS_MAP,
      hk: ['DIRECT'],
      jp: ['JP01'],
      sg: ['SG01'],
    }, ['JP01', 'SG01'], ALL_FEATURES_ON);
    const youtube = groups.find(g => g.name === GROUP.YOUTUBE);

    assert.deepEqual(youtube.proxies.slice(0, 5), [
      GROUP.JP,
      GROUP.SG,
      GROUP.TW,
      GROUP.MANUAL,
      GROUP.AUTO,
    ]);
    assert.ok(!youtube.proxies.includes(GROUP.HK));
  });

  it('social toggle controls IM/Social/TikTok groups', () => {
    const on = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_ON);
    const off = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_OFF);
    const onNames = on.map(g => g.name);
    const offNames = off.map(g => g.name);
    assert.ok(onNames.includes(GROUP.IM));
    assert.ok(!offNames.includes(GROUP.IM));
    assert.ok(onNames.includes(GROUP.SOCIAL));
    assert.ok(!offNames.includes(GROUP.SOCIAL));
    assert.ok(onNames.includes(GROUP.TIKTOK));
    assert.ok(!offNames.includes(GROUP.TIKTOK));
  });

  it('gaming toggle controls Gaming/Steam groups', () => {
    const on = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_ON);
    const off = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_OFF);
    const onNames = on.map(g => g.name);
    const offNames = off.map(g => g.name);
    assert.ok(onNames.includes(GROUP.GAMING));
    assert.ok(!offNames.includes(GROUP.GAMING));
    assert.ok(onNames.includes(GROUP.STEAM));
    assert.ok(!offNames.includes(GROUP.STEAM));
  });

  it('special toggle controls Talkatone/OneDrive/PayPal/PT groups', () => {
    const on = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_ON);
    const off = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_OFF);
    const onNames = on.map(g => g.name);
    const offNames = off.map(g => g.name);
    assert.ok(onNames.includes(GROUP.TALKATONE));
    assert.ok(!offNames.includes(GROUP.TALKATONE));
    assert.ok(onNames.includes(GROUP.ONEDRIVE));
    assert.ok(!offNames.includes(GROUP.ONEDRIVE));
    assert.ok(onNames.includes(GROUP.PAYPAL));
    assert.ok(!offNames.includes(GROUP.PAYPAL));
    assert.ok(onNames.includes(GROUP.PT));
    assert.ok(!offNames.includes(GROUP.PT));
  });

  it('region group proxies come from regionsMap', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_ON);
    const hkGroup = groups.find(g => g.name === GROUP.HK);
    assert.deepEqual(hkGroup.proxies, ['HK01', 'HK02']);
  });

  it('prunes empty regional groups and references when enabled', () => {
    const groups = buildProxyGroups({
      ...REGIONS_MAP,
      hk: ['HK01'],
      us: ['US01'],
      jp: ['DIRECT'],
      sg: [],
      tw: ['TW01'],
      ca: ['DIRECT'],
    }, ['HK01', 'US01', 'TW01'], PRUNE_EMPTY_REGION_FEATURES);
    const names = groups.map(g => g.name);

    assert.ok(names.includes(GROUP.AUTO));
    assert.ok(names.includes(GROUP.DIRECT));
    assert.ok(names.includes(GROUP.MANUAL));
    assert.ok(names.includes(GROUP.CATCH_ALL));
    assert.ok(names.includes(GROUP.NON_STD));
    assert.ok(names.includes(GROUP.HK));
    assert.ok(names.includes(GROUP.US));
    assert.ok(names.includes(GROUP.TW));
    assert.ok(!names.includes(GROUP.JP));
    assert.ok(!names.includes(GROUP.SG));
    assert.ok(!names.includes(GROUP.CA));

    for (const group of groups) {
      assert.ok(!group.proxies.includes(GROUP.JP), `${group.name} includes pruned JP group`);
      assert.ok(!group.proxies.includes(GROUP.SG), `${group.name} includes pruned SG group`);
      assert.ok(!group.proxies.includes(GROUP.CA), `${group.name} includes pruned CA group`);
    }
  });

  it('CATCH_ALL always exists', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_OFF);
    const catchAll = groups.find(g => g.name === GROUP.CATCH_ALL);
    assert.ok(catchAll);
  });

  it('CATCH_ALL prefers proxy choices before DIRECT', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_OFF);
    const catchAll = groups.find(g => g.name === GROUP.CATCH_ALL);

    assert.equal(catchAll.proxies[0], GROUP.AUTO);
    assert.ok(catchAll.proxies.includes(GROUP.DIRECT));
    assert.notEqual(catchAll.proxies.indexOf(GROUP.DIRECT), 0);
  });

  it('NON_STD contains DIRECT and CATCH_ALL', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['proxy1'], ALL_FEATURES_OFF);
    const nonStd = groups.find(g => g.name === GROUP.NON_STD);
    assert.ok(nonStd.proxies.includes(GROUP.DIRECT));
    assert.ok(nonStd.proxies.includes(GROUP.CATCH_ALL));
  });

  it('falls back to DIRECT when safeProxies is empty', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['DIRECT'], ALL_FEATURES_OFF);
    assert.ok(groups.length > 0);
  });

  it('keeps DIRECT fallback region groups when pruning is disabled', () => {
    const groups = buildProxyGroups({
      ...REGIONS_MAP,
      jp: ['DIRECT'],
    }, ['HK01'], ALL_FEATURES_ON);
    const jpGroup = groups.find(g => g.name === GROUP.JP);

    assert.deepEqual(jpGroup.proxies, ['DIRECT']);
  });
});

const STABLE_FEATURES = {
  regions: {
    core: [],
    extended: [],
    special: [],
  },
  proxyGroups: {
    basic: true, regional: false, streaming: false, ai: false,
    social: false, gaming: false, special: false, stableEgress: true,
  },
};

describe('buildProxyGroups stable egress', () => {
  it('builds only the fixed exit, Microsoft, and Apple groups in that order', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['US01', 'HK01', 'HK02'], STABLE_FEATURES);

    assert.deepEqual(groups.map(group => group.name), [
      GROUP.STABLE,
      GROUP.MICROSOFT,
      GROUP.APPLE,
    ]);
  });

  it('emits no dedicated Direct selector', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['US01'], STABLE_FEATURES);

    assert.ok(!groups.some(group => group.name === GROUP.DIRECT));
    assert.ok(!groups.some(group => group.name === GROUP.AUTO));
    assert.ok(!groups.some(group => group.name === GROUP.MANUAL));
  });

  it('keeps the fixed group as a plain selector without health checks', () => {
    const groups = buildProxyGroups(REGIONS_MAP, ['US01'], STABLE_FEATURES);
    const stable = groups.find(group => group.name === GROUP.STABLE);

    assert.equal(stable.type, 'select');
    assert.equal(stable.url, undefined);
    assert.equal(stable.interval, undefined);
    assert.ok(!stable.proxies.includes('DIRECT'));
    for (const name of [GROUP.AUTO, GROUP.MANUAL, GROUP.CATCH_ALL, GROUP.HK, GROUP.US]) {
      assert.ok(!stable.proxies.includes(name), `fixed group must not include ${name}`);
    }
  });

  it('orders fixed proxies US, SG, JP, HK, then the rest', () => {
    const groups = buildProxyGroups({
      hk: ['HK01'],
      us: ['US01'],
      jp: ['JP01'],
      sg: ['SG01'],
      other: ['OTHER01'],
    }, ['OTHER01', 'HK01', 'JP01', 'SG01', 'US01'], STABLE_FEATURES);
    const stable = groups.find(group => group.name === GROUP.STABLE);

    assert.deepEqual(stable.proxies, ['US01', 'SG01', 'JP01', 'HK01', 'OTHER01']);
  });

  it('puts DIRECT then Fixed Exit first in Apple and Microsoft groups', () => {
    const groups = buildProxyGroups({
      hk: ['HK01'],
      us: ['US01'],
    }, ['US01', 'HK01'], STABLE_FEATURES);
    const expected = ['DIRECT', GROUP.STABLE, 'US01', 'HK01'];

    assert.deepEqual(groups.find(group => group.name === GROUP.APPLE).proxies, expected);
    assert.deepEqual(groups.find(group => group.name === GROUP.MICROSOFT).proxies, expected);
  });

  it('falls back to DIRECT when no real proxy exists', () => {
    const groups = buildProxyGroups({
      hk: ['DIRECT'],
      us: ['DIRECT'],
    }, ['DIRECT'], STABLE_FEATURES);

    assert.deepEqual(groups.find(group => group.name === GROUP.STABLE).proxies, ['DIRECT']);
    assert.deepEqual(groups.find(group => group.name === GROUP.APPLE).proxies, [
      'DIRECT',
      GROUP.STABLE,
    ]);
    assert.deepEqual(groups.find(group => group.name === GROUP.MICROSOFT).proxies, [
      'DIRECT',
      GROUP.STABLE,
    ]);
  });
});
