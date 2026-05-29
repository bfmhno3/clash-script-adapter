import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildRules } from '../src/modules/rules.js';
import { GROUP } from '../src/modules/proxy-groups.js';

const ALL_ON = {
  rules: {
    basic: true, streaming: true, ai: true, social: true,
    gaming: true, special: true, process: true,
  },
};

const ALL_OFF = {
  rules: {
    basic: true, streaming: false, ai: false, social: false,
    gaming: false, special: false, process: false,
  },
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
    assert.ok(on.some(r => r.includes('PayPal')));
    assert.ok(!off.some(r => r.includes('PayPal')));
  });

  it('process toggle controls PROCESS-NAME rules', () => {
    const on = buildRules(ALL_ON, 'windows');
    const off = buildRules(ALL_OFF, 'windows');
    assert.ok(on.some(r => r.startsWith('PROCESS-NAME,')));
    assert.ok(!off.some(r => r.startsWith('PROCESS-NAME,')));
  });

  it('process rules are platform-specific', () => {
    const win = buildRules(ALL_ON, 'windows');
    assert.ok(win.some(r => r.includes('chrome.exe')));
    assert.ok(!win.some(r => r.includes('com.android.chrome')));

    const android = buildRules(ALL_ON, 'android');
    assert.ok(android.some(r => r.includes('com.android.chrome')));
    assert.ok(!android.some(r => r.includes('chrome.exe')));

    const macos = buildRules(ALL_ON, 'macos');
    assert.ok(macos.some(r => r.includes('Safari')));
    assert.ok(!macos.some(r => r.includes('chrome.exe')));

    const linux = buildRules(ALL_ON, 'linux');
    assert.ok(!linux.some(r => r.startsWith('PROCESS-NAME,')));
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
});
