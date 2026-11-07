/**
 * Build DNS configuration.
 *
 * Lean mode (default) follows the fake-ip principle: proxied domains are never
 * resolved locally, so fallback, fallback-filter, and nameserver-policy are not
 * needed. Only direct domains and fake-ip-filter entries are resolved, and they
 * use domestic encrypted DoH servers.
 *
 * Strict mode keeps the previous full isolation setup for users who want every
 * DNS path explicitly pinned.
 */

const LEAN_NAMESERVERS = [
  'https://dns.alidns.com/dns-query',
  'https://doh.pub/dns-query',
];

const LEAN_DEFAULT_NAMESERVERS = ['223.5.5.5', '119.29.29.29'];

const STRICT_NAMESERVERS = [
  'https://223.5.5.5/dns-query',
  'https://119.29.29.29/dns-query',
];

// Domains that must bypass fake-ip: LAN/private names, NTP, connectivity
// probes, and services that are routed DIRECT.
const LEAN_FAKE_IP_FILTER = [
  // RFC/local domains
  '*.lan','*.localdomain','*.example','*.invalid','*.localhost','*.test',
  '*.local','*.home.arpa','*.direct',
  // LAN infrastructure and router administration
  'cable.auth.com','PDC._msDCS.*.*','DC._msDCS.*.*','GC._msDCS.*.*',
  'heartbeat.belkin.com','*.linksys.com','*.linksyssmartwifi.com',
  '*.router.asus.com','Mijia Cloud','local.adguard.org',
  'injections.adguard.org',
  // Connectivity checks that must see a real IP
  'network-test.debian.org','detectportal.firefox.com',
  'resolver1.opendns.com','+.msftconnecttest.com','+.msftncsi.com',
  // NTP and time synchronization
  'time.*.com','time.*.gov','time.*.edu.cn','time.*.apple.com',
  'time-ios.apple.com','time1.*.com','time2.*.com','time3.*.com',
  'time4.*.com','time5.*.com','time6.*.com','time7.*.com','ntp.*.com',
  'ntp1.*.com','ntp2.*.com','ntp3.*.com','ntp4.*.com','ntp5.*.com',
  'ntp6.*.com','ntp7.*.com','*.time.edu.cn','*.ntp.org.cn',
  '+.pool.ntp.org','time1.cloud.tencent.com',
  // China-direct accounts, carriers, banking, and SMS
  'app.yinxiang.com','localhost.*.weixin.qq.com','localhost.ptlogin2.qq.com',
  'localhost.sec.qq.com','+.qq.com','+.tencent.com','*.blzstatic.cn',
  '*.cmpassport.com','id6.me','open.e.189.cn','opencloud.wostore.cn',
  'id.mail.wo.cn','mdn.open.wo.cn','hmrz.wo.cn','nishub1.10010.com',
  'enrichgw.10010.com','*.wosms.cn','*.jegotrip.com.cn',
  '*.icitymobile.mobi','*.pingan.com.cn','*.cmbchina.com',
  '*.10099.com.cn','*.microdone.cn','+.cmbchina.com','+.cmbimg.com',
  '+.pub.3gppnetwork.org',
  // China music services (DIRECT via geosite:cn)
  'music.163.com','*.music.163.com','*.126.net','musicapi.taihe.com',
  'music.taihe.com','songsearch.kugou.com','trackercdn.kugou.com',
  '*.kuwo.cn','y.qq.com','*.y.qq.com','streamoc.music.tc.qq.com',
  'mobileoc.music.tc.qq.com','isure.stream.qqmusic.qq.com',
  'dl.stream.qqmusic.qq.com','aqqmusic.tc.qq.com',
  'amobile.music.tc.qq.com','*.xiami.com','*.music.migu.cn',
  'music.migu.cn',
  // China game and accelerator endpoints (DIRECT via geosite:cn)
  '+.battlenet.com.cn','+.wotgame.cn','+.wggames.cn','+.wowsgame.cn',
  '*.ff14.sdo.com','ff.dorado.sdo.com','+.uu.163.com','ps.res.netease.com',
  '*.mcdn.bilivideo.cn',
];

// Proxied services that only need a real IP when strict mode resolves them
// through a proxied foreign resolver.
const STRICT_FAKE_IP_FILTER = [
  'global.turn.twilio.com','global.stun.twilio.com',
  'api-jooxtt.sanook.com','api.joox.com','joox.com',
  '+.srv.nintendo.net','*.n.n.srv.nintendo.net','+.cdn.nintendo.net',
  '+.stun.playstation.net',
  'xbox.*.*.microsoft.com','*.*.xboxlive.com','xbox.*.microsoft.com',
  'xnotify.xboxlive.com',
  '+.battle.net','+.wargaming.net',
  'proxy.golang.org',
  'stun.*.*','stun.*.*.*','+.stun.*.*','+.stun.*.*.*','+.stun.*.*.*.*',
  '+.stun.*.*.*.*.*',
  'mesu.apple.com','swscan.apple.com','swquery.apple.com',
  'swdownload.apple.com','swcdn.apple.com','swdist.apple.com',
  'lens.l.google.com','stun.l.google.com','na.b.g-tun.com',
  '+.nflxvideo.net',
  '*.square-enix.com','*.finalfantasyxiv.com','*.ffxiv.com',
  '+.media.dssott.com',
  'shark007.net',
  '+.sandai.net','+.n0808.com',
];

function buildBaseConfig(fakeIpFilter) {
  return {
    enable: true,
    'cache-algorithm': 'arc',        // ARC 比 LRU 更适合 DNS 缓存（自适应替换）
    'prefer-h3': false,              // DOH 不强制 HTTP/3（兼容性优先）
    'use-hosts': true,
    'use-system-hosts': true,
    'listen': '0.0.0.0:1053',
    ipv6: true,                      // Resolve AAAA and hand out fake IPv6 addresses
    'default-nameserver': [...LEAN_DEFAULT_NAMESERVERS],
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    // Keep the fake IPv6 pool outside fc00::/7: the TUN route-exclude-address
    // drops that range, so a ULA pool would never reach Mihomo.
    'fake-ip-range6': '2001:db8:9876::1/64',
    'fake-ip-filter-mode': 'blacklist',
    'fake-ip-filter': fakeIpFilter,
    'proxy-server-nameserver': [...LEAN_NAMESERVERS],
  };
}

function logDnsBuilt(mode, config, logger) {
  if (!logger) {
    return;
  }

  logger.info('dns-built', {
    directNameserverCount: config['direct-nameserver'] ?
      config['direct-nameserver'].length :
      0,
    enhancedMode: config['enhanced-mode'],
    fallbackCount: config.fallback ? config.fallback.length : 0,
    fakeIpFilterCount: config['fake-ip-filter'].length,
    fakeIpRange6: config['fake-ip-range6'],
    ipv6: config.ipv6,
    mode,
    nameserverCount: config.nameserver.length,
    proxyServerNameserverCount: config['proxy-server-nameserver'].length,
  });
}

/**
 * Lean DNS configuration: proxied domains are resolved by the remote exit,
 * direct domains use domestic DoH only.
 * @param {Object|null} logger Logger instance.
 * @returns {Object} DNS configuration.
 */
export function buildDnsConfig(logger = null) {
  const config = {
    ...buildBaseConfig([...LEAN_FAKE_IP_FILTER]),
    'respect-rules': false,          // DNS connections stay direct; upstreams are domestic
    nameserver: [...LEAN_NAMESERVERS],
  };

  logDnsBuilt('lean', config, logger);
  return config;
}

/**
 * Strict DNS configuration: keeps fallback, fallback-filter, and
 * nameserver-policy for full isolation of every resolution path.
 * @param {Object|null} logger Logger instance.
 * @returns {Object} DNS configuration.
 */
export function buildStrictDnsConfig(logger = null) {
  const config = {
    ...buildBaseConfig([...LEAN_FAKE_IP_FILTER, ...STRICT_FAKE_IP_FILTER]),
    'default-nameserver': ['223.5.5.5'],  // 用于解析加密 DNS 服务器域名，必须为 IP
    'respect-rules': true,           // DNS 连接遵守路由规则（需 proxy-server-nameserver）
    // 按域名地理位置分流 DNS 解析：国内走国内 DNS，国外走国外 DNS
    'nameserver-policy': {
      'geosite:cn,private': [
        'https://223.5.5.5/dns-query',
        'https://119.29.29.29/dns-query',
      ],
      'geosite:geolocation-!cn': [
        'https://dns.google/dns-query',
        'https://cloudflare-dns.com/dns-query',
      ],
    },
    nameserver: [...STRICT_NAMESERVERS],
    'proxy-server-nameserver': [...STRICT_NAMESERVERS],
    // 境外 DNS，用于对比验证国内 DNS 结果是否被污染
    fallback: [
      'https://dns.google/dns-query',
      'https://cloudflare-dns.com/dns-query',
      'tls://8.8.4.4',
      'tls://1.1.1.1',
    ],
    // direct 出口域名解析的 DNS 服务器
    'direct-nameserver': [
      'https://223.5.5.5/dns-query',
      'https://119.29.29.29/dns-query',
    ],
    'direct-nameserver-follow-policy': false,
    // 后备 DNS 过滤：nameserver 解析结果命中以下条件时，改用 fallback 结果
    'fallback-filter': {
      geoip: true,                   // 启用 geoip 判断
      'geoip-code': 'CN',           // CN IP 直接采用，非 CN IP 视为污染
      geosite: ['gfw'],
      ipcidr: [
        '::/128','::1/128','2001::/32','0.0.0.0/8','10.0.0.0/8','100.64.0.0/10',
        '127.0.0.0/8','169.254.0.0/16','172.16.0.0/12','192.0.0.0/24',
        '192.0.2.0/24','192.88.99.0/24','192.168.0.0/16','198.18.0.0/15',
        '198.51.100.0/24','203.0.113.0/24','224.0.0.0/4','240.0.0.0/4',
        '255.255.255.255/32',
      ],
      domain: [
        '+.google.com','+.facebook.com','+.youtube.com',
        '+.githubusercontent.com','+.googlevideo.com','+.msftconnecttest.com',
        '+.msftncsi.com',
      ],
    },
  };

  logDnsBuilt('strict', config, logger);
  return config;
}
