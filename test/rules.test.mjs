import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildRules } from '../src/modules/rules.js';
import { GROUP, buildProxyGroups } from '../src/modules/proxy-groups.js';

const ALL_ON = {
  rules: {
    basic: true, streaming: true, ai: true, social: true,
    gaming: true, special: true,
  },
};

const ALL_OFF = {
  rules: {
    basic: true, streaming: false, ai: false, social: false,
    gaming: false, special: false,
  },
};

const ALL_PROXY_GROUPS_ON = {
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

const REGIONS_MAP = {
  hk: ['HK01'],
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

describe('buildRules', () => {
  it('always includes basic rules', () => {
    const rules = buildRules(ALL_OFF);
    assert.ok(rules.some(r => r.includes('private')));
    assert.ok(rules.some(r => r.includes('giveup_direct')));
    assert.ok(rules.some(r => r.includes('google-cn')));
  });

  it('always includes tail rules with MATCH last', () => {
    const rules = buildRules(ALL_OFF);
    const last = rules[rules.length - 1];
    assert.ok(last.startsWith('MATCH,'));
    assert.ok(last.includes(GROUP.CATCH_ALL));
    assert.ok(rules.some(r => r.includes('cn,')));
  });

  it('streaming toggle controls YouTube/Netflix rules', () => {
    const on = buildRules(ALL_ON);
    const off = buildRules(ALL_OFF);
    assert.ok(on.some(r => r.includes('youtube')));
    assert.ok(!off.some(r => r.includes('youtube')));
    assert.ok(on.some(r => r.includes('netflix')));
    assert.ok(!off.some(r => r.includes('netflix')));
  });

  it('ai toggle controls OpenAI/Gemini rules', () => {
    const on = buildRules(ALL_ON);
    const off = buildRules(ALL_OFF);
    assert.ok(on.some(r => r.includes('openai')));
    assert.ok(!off.some(r => r.includes('openai')));
    assert.ok(on.some(r => r.includes('google-gemini')));
    assert.ok(!off.some(r => r.includes('google-gemini')));
  });

  it('AI rules target the unified AI Services group', () => {
    const rules = buildRules(ALL_ON);
    const aiRules = rules.filter(rule => (
      rule.startsWith('GEOSITE,openai,') ||
        rule.startsWith('GEOSITE,google-gemini,') ||
        rule.startsWith('GEOSITE,category-ai-!cn,')
    ));

    assert.equal(aiRules.length, 3);
    for (const rule of aiRules) {
      assert.equal(rule.split(',')[2], GROUP.AI);
    }
  });

  it('social toggle controls Telegram/Twitter/Facebook rules', () => {
    const on = buildRules(ALL_ON);
    const off = buildRules(ALL_OFF);
    assert.ok(on.some(r => r.includes('telegram')));
    assert.ok(!off.some(r => r.includes('telegram')));
    assert.ok(on.some(r => r.includes('twitter')));
    assert.ok(!off.some(r => r.includes('twitter')));
    assert.ok(on.some(r => r.includes('facebook')));
    assert.ok(!off.some(r => r.includes('facebook')));
  });

  it('gaming toggle controls Steam/game rules', () => {
    const on = buildRules(ALL_ON);
    const off = buildRules(ALL_OFF);
    assert.ok(on.some(r => r.includes('steam,')));
    assert.ok(!off.some(r => r.includes('steam,')));
    assert.ok(on.some(r => r.includes('category-games,')));
    assert.ok(!off.some(r => r.includes('category-games,')));
  });

  it('special toggle controls PayPal rules', () => {
    const on = buildRules(ALL_ON);
    const off = buildRules(ALL_OFF);
    assert.ok(on.some(r => r.includes('paypal')));
    assert.ok(!off.some(r => r.includes('paypal')));
  });

  it('does not generate PROCESS-NAME rules for any platform', () => {
    for (const platform of ['windows', 'macos', 'linux', 'android', 'unknown']) {
      const rules = buildRules(ALL_ON, platform);
      assert.ok(!rules.some(r => r.startsWith('PROCESS-NAME,')), platform);
    }
  });

  it('all features on produces more rules than all off', () => {
    const on = buildRules(ALL_ON);
    const off = buildRules(ALL_OFF);
    assert.ok(on.length > off.length);
  });

  it('all rules reference valid GROUP names', () => {
    const groupValues = new Set(Object.values(GROUP));
    const rules = buildRules(ALL_ON);
    for (const rule of rules) {
      const parts = rule.split(',');
      const groupPart = parts.length >= 3 ? parts[2]?.trim() : parts[1]?.trim();
      if (groupPart) {
        const group = groupPart.replace(/,no-resolve$/, '');
        assert.ok(
          groupValues.has(group) || group === 'DIRECT' || group === 'REJECT',
          `Rule "${rule}" references unknown group "${group}"`
        );
      }
    }
  });

  it('all rules reference generated groups for matching feature switches', () => {
    const generatedGroupNames = new Set(
      buildProxyGroups(REGIONS_MAP, ['HK01', 'US01', 'JP01'], ALL_PROXY_GROUPS_ON)
        .map(group => group.name)
    );
    const rules = buildRules(ALL_ON, 'windows');

    for (const rule of rules) {
      const parts = rule.split(',');
      const groupPart = parts.length >= 3 ? parts[2]?.trim() : parts[1]?.trim();
      if (groupPart) {
        assert.ok(
          generatedGroupNames.has(groupPart) || groupPart === 'DIRECT' || groupPart === 'REJECT',
          `Rule "${rule}" references a group that is not generated`
        );
      }
    }
  });
});
