/**
 * 构建 DNS 配置，防止 DNS 泄露。
 * 使用 fake-ip 模式 + 国内外分流 nameserver + fallback-filter 污染防护。
 */
export function buildDnsConfig() {
  return {
    enable: true,
    'cache-algorithm': 'arc',        // ARC 比 LRU 更适合 DNS 缓存（自适应替换）
    'prefer-h3': false,              // DOH 不强制 HTTP/3（兼容性优先）
    'use-hosts': true,
    'use-system-hosts': true,
    'respect-rules': true,           // DNS 连接遵守路由规则（需 proxy-server-nameserver）
    'listen': '0.0.0.0:1053',
    ipv6: false,                     // 不解析 AAAA（避免 IPv6 泄露）
    'default-nameserver': ['223.5.5.5'],  // 用于解析加密 DNS 服务器域名，必须为 IP
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/16',
    'fake-ip-filter-mode': 'blacklist',
    'fake-ip-filter': [
      '*.lan','*.localdomain','*.example','*.invalid','*.localhost','*.test',
      '*.local','*.home.arpa','*.direct','cable.auth.com',
      'network-test.debian.org','detectportal.firefox.com',
      'resolver1.opendns.com','global.turn.twilio.com','global.stun.twilio.com',
      'app.yinxiang.com','injections.adguard.org','localhost.*.weixin.qq.com',
      '*.blzstatic.cn','*.cmpassport.com','id6.me','open.e.189.cn',
      'opencloud.wostore.cn','id.mail.wo.cn','mdn.open.wo.cn','hmrz.wo.cn',
      'nishub1.10010.com','enrichgw.10010.com','*.wosms.cn','*.jegotrip.com.cn',
      '*.icitymobile.mobi','*.pingan.com.cn','*.cmbchina.com','*.10099.com.cn',
      '*.microdone.cn','PDC._msDCS.*.*','DC._msDCS.*.*','GC._msDCS.*.*',
      'time.*.com','time.*.gov','time.*.edu.cn','time.*.apple.com',
      'time-ios.apple.com','time1.*.com','time2.*.com','time3.*.com',
      'time4.*.com','time5.*.com','time6.*.com','time7.*.com','ntp.*.com',
      'ntp1.*.com','ntp2.*.com','ntp3.*.com','ntp4.*.com','ntp5.*.com',
      'ntp6.*.com','ntp7.*.com','*.time.edu.cn','*.ntp.org.cn','+.pool.ntp.org',
      'time1.cloud.tencent.com',
      'music.163.com','*.music.163.com','*.126.net',
      'musicapi.taihe.com','music.taihe.com',
      'songsearch.kugou.com','trackercdn.kugou.com',
      '*.kuwo.cn',
      'api-jooxtt.sanook.com','api.joox.com','joox.com',
      'y.qq.com','*.y.qq.com','streamoc.music.tc.qq.com',
      'mobileoc.music.tc.qq.com','isure.stream.qqmusic.qq.com',
      'dl.stream.qqmusic.qq.com','aqqmusic.tc.qq.com','amobile.music.tc.qq.com',
      '*.xiami.com',
      '*.music.migu.cn','music.migu.cn',
      '+.msftconnecttest.com','+.msftncsi.com',
      'localhost.ptlogin2.qq.com','localhost.sec.qq.com','+.qq.com',
      '+.tencent.com',
      '+.srv.nintendo.net','*.n.n.srv.nintendo.net','+.cdn.nintendo.net',
      '+.stun.playstation.net',
      'xbox.*.*.microsoft.com','*.*.xboxlive.com','xbox.*.microsoft.com',
      'xnotify.xboxlive.com',
      '+.battle.net','+.battlenet.com.cn','+.wotgame.cn','+.wggames.cn',
      '+.wowsgame.cn','+.wargaming.net',
      'proxy.golang.org',
      'stun.*.*','stun.*.*.*','+.stun.*.*','+.stun.*.*.*','+.stun.*.*.*.*',
      '+.stun.*.*.*.*.*',
      'heartbeat.belkin.com','*.linksys.com','*.linksyssmartwifi.com',
      '*.router.asus.com',
      'mesu.apple.com','swscan.apple.com','swquery.apple.com',
      'swdownload.apple.com','swcdn.apple.com','swdist.apple.com',
      'lens.l.google.com','stun.l.google.com','na.b.g-tun.com',
      '+.nflxvideo.net',
      '*.square-enix.com','*.finalfantasyxiv.com','*.ffxiv.com',
      '*.ff14.sdo.com','ff.dorado.sdo.com',
      '*.mcdn.bilivideo.cn',
      '+.media.dssott.com',
      'shark007.net',
      'Mijia Cloud',
      '+.cmbchina.com','+.cmbimg.com',
      'local.adguard.org',
      '+.sandai.net','+.n0808.com',
      '+.uu.163.com','ps.res.netease.com',
      '+.pub.3gppnetwork.org',
    ],
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
    // 国内 DNS（阿里 + 腾讯）
    nameserver: [
      'https://223.5.5.5/dns-query',
      'https://119.29.29.29/dns-query',
    ],
    // 境外 DNS，用于对比验证国内 DNS 结果是否被污染
    fallback: [
      'https://dns.google/dns-query',
      'https://cloudflare-dns.com/dns-query',
      'tls://8.8.4.4',
      'tls://1.1.1.1',
    ],
    // 代理节点域名解析服务器（仅用于解析代理节点自身的域名）
    'proxy-server-nameserver': [
      'https://223.5.5.5/dns-query',
      'https://119.29.29.29/dns-query',
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
}
