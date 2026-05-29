import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getRegionProxies } from '../src/modules/regions.js';

describe('getRegionProxies', () => {
  it('classifies HK proxies', () => {
    const result = getRegionProxies(['🇭🇰 香港 IPLC', '港深专线', 'HK01', 'Hong Kong', 'HKG']);
    assert.ok(result.hk.includes('🇭🇰 香港 IPLC'));
    assert.ok(result.hk.includes('港深专线'));
    assert.ok(result.hk.includes('HK01'));
    assert.ok(result.hk.includes('Hong Kong'));
    assert.ok(result.hk.includes('HKG'));
  });

  it('classifies US proxies', () => {
    const result = getRegionProxies(['🇺🇸 美国', '洛杉矶 LAX', 'SFO', 'JFK', '西雅图']);
    assert.ok(result.us.includes('🇺🇸 美国'));
    assert.ok(result.us.includes('洛杉矶 LAX'));
    assert.ok(result.us.includes('SFO'));
    assert.ok(result.us.includes('JFK'));
    assert.ok(result.us.includes('西雅图'));
  });

  it('classifies JP proxies', () => {
    const result = getRegionProxies(['🇯🇵 日本', '东京', 'JP01', 'NRT', '大阪']);
    assert.ok(result.jp.includes('🇯🇵 日本'));
    assert.ok(result.jp.includes('东京'));
    assert.ok(result.jp.includes('JP01'));
    assert.ok(result.jp.includes('NRT'));
    assert.ok(result.jp.includes('大阪'));
  });

  it('classifies SG proxies', () => {
    const result = getRegionProxies(['🇸🇬 新加坡', 'SG01', 'Singapore', 'SIN']);
    assert.ok(result.sg.includes('🇸🇬 新加坡'));
    assert.ok(result.sg.includes('SG01'));
    assert.ok(result.sg.includes('Singapore'));
    assert.ok(result.sg.includes('SIN'));
  });

  it('classifies TW proxies', () => {
    const result = getRegionProxies(['🇹🇼 台湾', 'TW01', 'Taiwan', 'TPE']);
    assert.ok(result.tw.includes('🇹🇼 台湾'));
    assert.ok(result.tw.includes('TW01'));
    assert.ok(result.tw.includes('Taiwan'));
    assert.ok(result.tw.includes('TPE'));
  });

  it('classifies KR proxies', () => {
    const result = getRegionProxies(['🇰🇷 韩国', 'KR01', 'ICN', '首尔']);
    assert.ok(result.kr.includes('🇰🇷 韩国'));
    assert.ok(result.kr.includes('KR01'));
    assert.ok(result.kr.includes('ICN'));
    assert.ok(result.kr.includes('首尔'));
  });

  it('classifies CA proxies', () => {
    const result = getRegionProxies(['🇨🇦 加拿大', 'CA01', 'YVR', '温哥华']);
    assert.ok(result.ca.includes('🇨🇦 加拿大'));
    assert.ok(result.ca.includes('CA01'));
    assert.ok(result.ca.includes('YVR'));
    assert.ok(result.ca.includes('温哥华'));
  });

  it('classifies GB proxies', () => {
    const result = getRegionProxies(['🇬🇧 英国', 'UK01', 'LHR', '伦敦']);
    assert.ok(result.gb.includes('🇬🇧 英国'));
    assert.ok(result.gb.includes('UK01'));
    assert.ok(result.gb.includes('LHR'));
    assert.ok(result.gb.includes('伦敦'));
  });

  it('classifies FR proxies', () => {
    const result = getRegionProxies(['🇫🇷 法国', 'FR01', 'CDG', '巴黎']);
    assert.ok(result.fr.includes('🇫🇷 法国'));
    assert.ok(result.fr.includes('FR01'));
    assert.ok(result.fr.includes('CDG'));
    assert.ok(result.fr.includes('巴黎'));
  });

  it('classifies DE proxies', () => {
    const result = getRegionProxies(['🇩🇪 德国', 'DE01', 'MUC', '柏林']);
    assert.ok(result.de.includes('🇩🇪 德国'));
    assert.ok(result.de.includes('DE01'));
    assert.ok(result.de.includes('MUC'));
    assert.ok(result.de.includes('柏林'));
  });

  it('classifies NL proxies', () => {
    const result = getRegionProxies(['🇳🇱 荷兰', 'NL01', 'AMS', '阿姆斯特丹']);
    assert.ok(result.nl.includes('🇳🇱 荷兰'));
    assert.ok(result.nl.includes('NL01'));
    assert.ok(result.nl.includes('AMS'));
    assert.ok(result.nl.includes('阿姆斯特丹'));
  });

  it('classifies TR proxies', () => {
    const result = getRegionProxies(['🇹🇷 土耳其', 'TR01', 'IST', 'Turkey']);
    assert.ok(result.tr.includes('🇹🇷 土耳其'));
    assert.ok(result.tr.includes('TR01'));
    assert.ok(result.tr.includes('IST'));
    assert.ok(result.tr.includes('Turkey'));
  });

  it('classifies RU proxies', () => {
    const result = getRegionProxies(['🇷🇺 俄罗斯', 'RU01', '莫斯科', 'Russia']);
    assert.ok(result.ru.includes('🇷🇺 俄罗斯'));
    assert.ok(result.ru.includes('RU01'));
    assert.ok(result.ru.includes('莫斯科'));
    assert.ok(result.ru.includes('Russia'));
  });

  it('classifies home proxies', () => {
    const result = getRegionProxies(['家宽', '家庭宽带', '住宅', 'Residential']);
    assert.ok(result.home.includes('家宽'));
    assert.ok(result.home.includes('家庭宽带'));
    assert.ok(result.home.includes('住宅'));
    assert.ok(result.home.includes('Residential'));
  });

  it('classifies low proxies', () => {
    const result = getRegionProxies(['低倍率', '0.5x', '倍率:0.3']);
    assert.ok(result.low.includes('低倍率'));
    assert.ok(result.low.includes('0.5x'));
    assert.ok(result.low.includes('倍率:0.3'));
  });

  it('classifies unmatched proxies into other', () => {
    const result = getRegionProxies(['神秘节点', 'random_server']);
    assert.ok(result.other.includes('神秘节点'));
    assert.ok(result.other.includes('random_server'));
  });

  it('returns DIRECT for empty arrays in all regions', () => {
    const result = getRegionProxies([]);
    for (const key of Object.keys(result)) {
      assert.deepEqual(result[key], ['DIRECT']);
    }
  });

  it('does not duplicate proxies across regions (except other)', () => {
    const proxies = ['🇭🇰 HK01', '🇺🇸 US01', '🇯🇵 JP01', '未知节点'];
    const result = getRegionProxies(proxies);
    assert.ok(result.hk.includes('🇭🇰 HK01'));
    assert.ok(!result.us.includes('🇭🇰 HK01'));
    assert.ok(!result.jp.includes('🇭🇰 HK01'));
    assert.ok(result.other.includes('未知节点'));
    assert.ok(!result.hk.includes('未知节点'));
  });
});
