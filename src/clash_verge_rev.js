/**
 * Clash/Mihomo 全局转换脚本入口
 * 负责解析原始配置，注入防 DNS 泄露规则和重写分流策略
 * 
 * @param {Object} config - 原始的 Clash/Mihomo 配置对象
 * @param {string} profilename - 当前订阅配置文件的名称
 * @returns {Object} 返回注入了无泄漏配置的全新 config 对象
 */
function main(config, profilename) {
  const proxyNames = (config.proxies || []).map(p => p.name);
  
  // 获取已分组的节点
  const regions = getRegionProxies(proxyNames);

  // 注入全局配置并强制生效
  Object.assign(config, buildGlobalSettings());

  // 配置 DNS 服务，防止 DNS 泄露问题
  config.dns = buildDnsConfig();

  return config;
}

/**
 * 构建 Clash/Mihomo 的全局基础配置模板。
 * 
 * 该函数返回一份“完整默认设置”，覆盖运行模式、局域网访问、API、TLS、
 * GEO 数据、缓存与网络行为等全局参数，供后续主流程按需合并到订阅配置中。
 *
 * @returns {Object} 全局设置对象（可直接用于 merge，或作为默认配置基线）
 */
function buildGlobalSettings() {
  const config = {
    // #region ====== 允许局域网 ===============================================

    // 允许其他设备经过 Clash 的代理端口访问互联网
    'allow-lan': false,

    // 绑定地址，仅允许其他设备通过这个地址访问
    // '*' 表示绑定所有 IP 地址
    // '192.168.31.31' 表示绑定单个 IPv4 地址
    // 'aaaa::a8aa:ff:fe09:57d8' 表示绑定单个 IPv6 地址
    'bind-address': '*',

    // 允许连接的 IP 地址段，仅作用于 allow-lan 为 true 时
    // 默认值为 0.0.0.0/0 和 ::/0，表示允许所有 IP 地址连接
    'lan-allowed-ips': [ '0.0.0.0/0', '::/0' ],

    // 禁止连接的 IP 地址段，黑名单优先级高于白名单，默认值为空
    'lan-disallowed-ips': [ '192.168.0.3/32' ],

    // #endregion ==============================================================

    // #region ====== 用户验证 =================================================

    // http(s)/socks/mixed 代理的用户验证
    authentication: [ 'user1:pass1', 'user2:pass2' ],

    // 设置允许跳过验证的 IP 段
    'skip-auth-prefixes': [ '127.0.0.1/8', '::1/28' ],

    // #endregion ==============================================================

    // #region ====== 运行模式 =================================================

    // 运行模式（默认值为 rule）：
    // rule: 规则匹配
    // global: 全局代理（需要在 GLOBAL 策略组选择代理/策略）
    // direct：全局直连
    mode: 'rule',

    // #endregion ==============================================================

    // #region ====== 日志级别 =================================================

    // clash 内核输出日志的等级，仅在控制台和控制页面输出
    // silent：静默，不输出
    // error：仅输出发生错误至无法使用的日志
    // warning：输出发生错误但不影响运行的日志，以及 error 级别内容
    // info：输出一般运行的内容，以及 error 和 warning 级别的日志
    // debug：尽可能的输出运行中所有的信息
    'log-level': 'info',

    // #endregion ==============================================================

    // #region ====== IPv6 =====================================================

    // 是否允许内核接受 IPv6 流量，默认为 true
    ipv6: true,

    // #endregion ==============================================================

    // #region ====== TCP Keep Alive 设置 ======================================

    // 修改此项以减少移动设备耗电问题
    // 详细请参考：https://github.com/vernesong/OpenClash/issues/2614

    // TCP Keep Alive 包的间隔，单位为秒
    'keep-alive-interval': 15,

    // TCP Keep Alive 的最大空闲时间
    'keep-alive-idle': 60,

    // 禁用 TCP Keep Alive，在 Android 强制为 true
    'disable-keep-alive': true,

    // #endregion ==============================================================

    // #region ====== 进程匹配模式 =============================================

    // 控制是否让 Clash 去匹配进程
    // always：开启，强制匹配所有进程
    // strict：默认，由 Clash 判断是否开启
    // off：不匹配进程，推荐在路由器上使用此模式
    'find-process-mode': 'strict',

    // #endregion ==============================================================

    // #region ====== 外部控制 (API) ===========================================

    // 外部控制器，可以使用 RESTful API 来控制 Clash 的行为
    // API 监听地址，你可以将 127.0.0.1 修改为 0.0.0.0 来监听所有 IP
    'external-controller': '127.0.0.1:9090',

    // API CORS 标头配置
    'external-controller-cors': {
      'allow-origins': [ '*' ],
      'allow-private-network': true,
    },

    // Unix socket API 监听地址
    // 从 Unix socket 访问 API 接口不会验证 secret，如果开启请自行保证安全问题
    // 注释、删除或者赋值为空字符串以禁用此项
    // 'external-controller-unix': 'mihomo.sock',

    // Windows namedpipe API 监听地址
    // 从 Windows namedpipe 访问 API 接口不会验证 secret，如果开启请自行保证安全问题
    // 注释、删除或者赋值为空字符串以禁用此项
    // 'external-controller-pipe': '\\\\.\\pipe\\mihomo',

    // HTTPS-API 监听地址，需要配置 tls 部分证书和其私钥配置
    // 使用 TLS 也必须填写 external-controller
    // 注释、删除或者赋值为空字符串以禁用此项
    // 'external-controller-tls': '127.0.0.1:9443',

    // 在 RESTful API 端口上开启 DoH 服务器
    // 该 URL 不会验证 secret，如果开启请自行保证安全问题
    // 注释、删除或者赋值为空字符串以禁用此项
    // 'external-doh-server': '/dns-query',

    // API 的访问密钥
    secret: '',

    // #endregion ==============================================================

    // #region ====== 外部用户界面 =============================================
    
    // 可以将静态网页资源（比如 Clash-dashboard）运行在 Claash API，
    // 路径为 API 地址 /ui
    // 可以为绝对路径，或者 Clash 工作目录的相对路径

    // 注意：如果路径不在 Clash 工作目录下，请手动设置 SAFE_PATHS 环境变量将其加
    // 入安全路径，该环境白能量的语法同本操作系统的 PATH 环境变量解析规则（即 
    // Windows 下以分号分割，其他系统下以冒号分割）
    'external-ui': '/path/to/ui/folder',

    // #endregion ==============================================================

    // #region ====== 自定义外部用户界面名字 ===================================

    // 非必要，更新时会更新到指定文件夹，不配置则直接更新到 external-ui 目录
    // 'external-ui-name': 'xd',

    // #endregion ==============================================================

    // #region ====== 自定义外部用户界面下载地址 ===============================
    
    'external-ui-url':
      "https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip",

    // #endregion ==============================================================

    // #region ====== 缓存 =====================================================

    profile: {
      // 储存 API 对策略组的选择，以供下次启动时使用
      'store-selected': true,
      // 储存 fakeip 映射表，域名再次发生连接时，使用原有映射地址
      'store-fake-ip': true,
    },

    // #endregion ==============================================================

    // #region ====== 统一延迟 =================================================

    // 开启统一延迟时，会计算 RTT，以消除连接握手等带来的不同类型节点的延迟差异
    'unified-delay': true,

    // #endregion ==============================================================

    // #region ====== TCP 并发 =================================================

    // 启用 TCP 并发连接，将会使用 DNS 解析出的所有 IP 地址进行连接，
    // 使用第一个成功的连接
    'tcp-concurrent': true,

    // #endregion ==============================================================

    // #region ====== 出站接口 =================================================

    // mihomo 的流量出站接口
    // 'interface-name': 'en0',

    // #endregion ==============================================================

    // #region ====== 路由标记 =================================================

    // 为 Linux 下的出站连接提供默认流量标记
    'routing-mark': 6666,

    // #endregion ==============================================================

    // #region ====== TLS ======================================================

    // 目前仅用于 API 的 https
    tls: {
      // 证书 PEM 格式，或者证书的路径
      certificate: 'string',
      
      // 证书对应的私钥 PEM 格式，或者私钥路径
      'private-key': 'string',

      // ECH 密钥，如果调谐则会启用 ECH
      'ech-key': `
        -----BEGIN ECH KEYS-----
        ACATwY30o/RKgD6hgeQxwrSiApLaCgU+HKh7B6SUrAHaDwBD/g0APwAAIAAgHjzK
        madSJjYQIf9o1N5GXjkW4DEEeb17qMxHdwMdNnwADAABAAEAAQACAAEAAwAIdGVz
        dC5jb20AAA==
        -----END ECH KEYS-----
      `
    },

    // #endregion ==============================================================

    // #region ====== 全局客户端指纹 ===========================================

    // 全局 TLS 指纹已经被弃用，请直接在 proxy 内设置 client-fingerprint

    // #endregion ==============================================================

    // #region ====== GEOIP 数据模式 ===========================================

    // 更改 geoip 使用文件，mmdb 或者 dat
    // 可选 true/false, true 为 dat，此项游默认值 false
    'geodata-mode': true,

    // #endregion ==============================================================

    // #region ====== GEO 文件加载模式 =========================================
    
    // 可选的加载模式如下：
    // standard：标准加载器
    // memconservative：专为内存受限（小内存）设备优化的加载器（默认值）
    'geodata-loader': 'memconservative',

    // #endregion ==============================================================

    // #region ====== 自动更新 GEO =============================================
    
    'geo-auto-update': true,

    // 更新间隔，单位为小时
    'geo-update-interval': 24,

    // #endregion ==============================================================

    // #region ====== 自定 GEO 下载地址 ========================================

    'geo-url': {
      geoip: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat",
      geosite: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
      mmdb: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb",
      asn: "https://github.com/xishang0128/geoip/releases/download/latest/GeoLite2-ASN.mmdb",
    },

    // #endregion ==============================================================

    // #region ====== 自定全局 UA ==============================================

    // 自定义外部资源下载时使用的 UA，默认为 clash.meta]
    'global-ua': 'clash.meta',

    // #endregion ==============================================================

    // #region ====== ETag 支持 ================================================

    // 外部资源下载的 ETag 支持，默认为 true
    'etag-support': true,

    // #endregion ==============================================================
  }

  return config;
}

/**
 * 根据代理名称分类为不同地区的代理列表
 * 
 * 该函数通过正则表达式匹配代理名称中的地区标识（如国旗、地名、机场代码等），
 * 将输入的代理列表分类为香港、美国、日本、新加坡、台湾、韩国等地区组。
 * 每个地区返回至少包含一个代理，如果该地区无匹配的代理则返回 ['DIRECT']。
 *
 * @param {string[]} proxyNames - 代理名称数组
 * @returns {Object} 按地区分类的代理对象
 * @returns {string[]} return.hk - 香港代理列表
 * @returns {string[]} return.us - 美国代理列表
 * @returns {string[]} return.jp - 日本代理列表
 * @returns {string[]} return.sg - 新加坡代理列表
 * @returns {string[]} return.tw - 台湾代理列表
 * @returns {string[]} return.kr - 韩国代理列表
 */
function getRegionProxies(proxyNames) {
  // 模仿 Aethersailor 配置模板的定义
  const hkRegex = /(🇭🇰|港|\bHK(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|hk|Hong Kong|HongKong|hongkong|HONG KONG|HONGKONG|深港|HKG|九龙|Kowloon|新界|沙田|荃湾|葵涌)/i;
  const usRegex = /(🇺🇸|美|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|纽约|纽纽|亚特兰大|迈阿密|华盛顿|\bUS(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|United States|UnitedStates|UNITED STATES|USA|America|AMERICA|JFK|EWR|IAD|ATL|ORD|MIA|NYC|LAX|SFO|SEA|DFW|SJC)/i;
  const jpRegex = /(🇯🇵|日本|川日|东京|大阪|泉日|埼玉|沪日|深日|(?<!尼|-)日|\bJP(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|Japan|JAPAN|JPN|NRT|HND|KIX|TYO|OSA|关西|Kansai|KANSAI)/i;
  const sgRegex = /(🇸🇬|新加坡|坡|狮城|\bSG(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|Singapore|SINGAPORE|SIN)/i;
  const twRegex = /(🇹🇼|🇼🇸|台|新北|彰化|\bTW(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|Taiwan|TAIWAN|TWN|TPE|ROC)/i;
  const krRegex = /(🇰🇷|\bKR(?:[-_ ]?\d+(?:[-_ ]?[A-Za-z]{2,})?)?\b|Korea|KOREA|KOR|首尔|韩|韓|春川|Chuncheon|ICN)/i;

  const getProxies = (regex) => {
    const matched = proxyNames.filter(name => regex.test(name));
    return matched.length > 0 ? matched : ['DIRECT']; // 防止某些地区无节点导致核心报错
  };

  return {
    hk: getProxies(hkRegex),
    us: getProxies(usRegex),
    jp: getProxies(jpRegex),
    sg: getProxies(sgRegex),
    tw: getProxies(twRegex),
    kr: getProxies(krRegex)
  };
}

/**
 * 构建 Clash/Mihomo 的 DNS 服务配置。
 * 
 * 该函数返回一份完整的 DNS 配置方案，覆盖缓存算法、FakeIP 模式、
 * DNS 服务器选择、DNS 污染防护等内容，以防止 DNS 泄露问题。
 * 支持按照地理位置 (geosite) 和 GEOIP 规则进行分流解析。
 *
 * @returns {Object} DNS 配置对象，包含 enable、listen、enhanced-mode、
 *                   fake-ip-range、nameserver、fallback 等完整配置项
 */
function buildDnsConfig() {
  const config = {
    // #region ====== enable ===================================================

    // 是否启用，如为 false，则使用系统 DNS 解析。
    enable: true,

    // #endregion ==============================================================

    // #region ====== cache-algorithm ==========================================

    // 支持的算法：
    // lru (Least Recently Used)，默认值; 
    // arc (Adaptive Replacement Cache)。
    'cache-algorithm': 'arc',

    // #endregion ==============================================================

    // #region ====== prefer-h3 ================================================

    // DOH 优先使用 http/3。
    'prefer-h3': false,

    // #endregion ==============================================================

    // #region ====== use-hosts ================================================

    // 是否回应配置中的 hosts，默认 true。
    'use-hosts': true,

    // #endregion ==============================================================

    // #region ====== use-system-hosts =========================================

    // 是否查询系统 hosts，默认 true。
    'use-system-hosts': true,

    // #endregion ==============================================================

    // #region ====== respect-rules ============================================

    // dns 连接遵守路由规则，需配置 proxy-server-nameserver。
    // 强烈不建议和 prefer-h3 一起使用！
    'respect-rules': true,

    // #endregion ==============================================================

    // #region ====== listen ===================================================

    // DNS 服务监听，支持 udp, tcp。
    'listen': '0.0.0.0:1053',

    // #endregion ==============================================================

    // #region ====== ipv6 =====================================================

    // 是否解析 IPV6，如为 false，则回应 AAAA 的空解析。
    ipv6: false,

    // #endregion ==============================================================

    // #region ====== default-nameserver =======================================

    // 默认 DNS，用于解析 DNS 服务器的域名。
    // 必须为 IP，可为加密 DNS。
    'default-nameserver': ['223.5.5.5'],

    // #endregion ==============================================================

    // #region ====== enhanced-mode ============================================

    // mihomo 的 DNS 处理模式。可选值 fake-ip/redir-host，默认 redir-host。
    'enhanced-mode': 'fake-ip',

    // #endregion ==============================================================

    // #region ====== fake-ip-range ============================================

    // fakeip 下的 IP 段设置，tun 的默认 IPV4 地址也适用此值作为参考。
    'fake-ip-range': '198.18.0.1/16',

    // #endregion ==============================================================

    // #region ====== fake-ip-range6 ===========================================

    // fakeip 下的 IPv6 段设置。
    // 'fake-ip-range6': 'fdfe:dcba:9897::1/64',

    // #endregion ==============================================================

    // #region ====== fake-ip-filter-mode ======================================

    // 可选 blacklist/whitelist/rule，默认 blacklist
    // whitelist 即只有在匹配成功才返回 fakeip。
    // 当为 rule 时写法发生改变
    // 参照 https://wiki.metacubex.one/config/dns/#fake-ip-filter
    'fake-ip-filter-mode': 'blacklist', 

    // #endregion ==============================================================

    // #region ====== fake-ip-filter ===========================================

    // fakeip 过滤，以下地址不会下发 fakeip 映射用于连接
    // 值支持域名通配以及引入域名集合
    // 粘贴复制自 OpenClash 相应配置，感谢开发者的付出
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
      // 放行 NTP 服务
      'time.*.com','time.*.gov','time.*.edu.cn','time.*.apple.com',
      'time-ios.apple.com','time1.*.com','time2.*.com','time3.*.com',
      'time4.*.com','time5.*.com','time6.*.com','time7.*.com','ntp.*.com',
      'ntp1.*.com','ntp2.*.com','ntp3.*.com','ntp4.*.com','ntp5.*.com',
      'ntp6.*.com','ntp7.*.com','*.time.edu.cn','*.ntp.org.cn','+.pool.ntp.org',
      'time1.cloud.tencent.com',
      // 放行网易云音乐
      'music.163.com','*.music.163.com','*.126.net',
      // 百度音乐
      'musicapi.taihe.com','music.taihe.com',
      // 酷狗音乐
      'songsearch.kugou.com','trackercdn.kugou.com',
      // 酷我音乐
      '*.kuwo.cn',
      // JOOX 音乐
      'api-jooxtt.sanook.com','api.joox.com','joox.com',
      // QQ 音乐
      'y.qq.com','*.y.qq.com','streamoc.music.tc.qq.com',
      'mobileoc.music.tc.qq.com','isure.stream.qqmusic.qq.com',
      'dl.stream.qqmusic.qq.com','aqqmusic.tc.qq.com','amobile.music.tc.qq.com',
      // 虾米音乐
      '*.xiami.com',
      // 咪咕音乐
      '*.music.migu.cn','music.migu.cn',
      // Windows 本地连接检测
      '+.msftconnecttest.com','+.msftncsi.com',
      // QQ 登录
      'localhost.ptlogin2.qq.com','localhost.sec.qq.com','+.qq.com',
      '+.tencent.com',
      // Game
      // Nintendo Switch
      '+.srv.nintendo.net','*.n.n.srv.nintendo.net','+.cdn.nintendo.net',
      // Sony PlayStation
      '+.stun.playstation.net',
      // Microsoft Xbox
      'xbox.*.*.microsoft.com','*.*.xboxlive.com','xbox.*.microsoft.com',
      'xnotify.xboxlive.com',
      // Wotgame
      '+.battle.net','+.battlenet.com.cn','+.wotgame.cn','+.wggames.cn',
      '+.wowsgame.cn','+.wargaming.net',
      // Golang
      'proxy.golang.org',
      // STUN
      'stun.*.*','stun.*.*.*','+.stun.*.*','+.stun.*.*.*','+.stun.*.*.*.*',
      '+.stun.*.*.*.*.*',
      // Linksys Router
      'heartbeat.belkin.com','*.linksys.com','*.linksyssmartwifi.com',
      // ASUS Router
      '*.router.asus.com',
      // Apple Software Update Service
      'mesu.apple.com','swscan.apple.com','swquery.apple.com',
      'swdownload.apple.com','swcdn.apple.com','swdist.apple.com',
      // Google
      'lens.l.google.com','stun.l.google.com','na.b.g-tun.com',
      // Netflix
      '+.nflxvideo.net',
      // FinalFantasy XIV Worldwide Server & CN Server
      '*.square-enix.com','*.finalfantasyxiv.com','*.ffxiv.com',
      '*.ff14.sdo.com','ff.dorado.sdo.com',
      // Bilibili
      '*.mcdn.bilivideo.cn',
      // Disney Plus
      '+.media.dssott.com',
      // Shark007 Codecs
      'shark007.net',
      // Mijia
      'Mijia Cloud',
      // 招商银行
      '+.cmbchina.com','+.cmbimg.com',
      // Adguard
      'local.adguard.org',
      // 迅雷
      '+.sandai.net','+.n0808.com',
      // UU Plugin
      '+.uu.163.com','ps.res.netease.com',
      // Wifi Calling
      '+.pub.3gppnetwork.org',
      // GEOSITE(Meta core),
      // geosite:category-games,
      // geosite:apple-cn,
      // geosite:google-cn
    ],
    
    // #endregion ==============================================================
    
    // #region ====== fake-ip-ttl ==============================================

    // 配置 fakeip 查询返回的 TTL，非必要情况下请勿修改
    // 'fake-ip-ttl": 1,

    // #endregion ==============================================================
    
    // #region ====== nameserver-policy ========================================

    // 指定域名查询的解析服务器，可使用 geosite，优先于 nameserver/fallback 查询
    'nameserver-policy': {
      'geosite:cn,private': [
        'https://223.5.5.5/dns-query',
        'https://119.29.29.29/dns-query'
      ],
      'geosite:geolocation-!cn': [
        'https://dns.google/dns-query',
        'https://cloudflare-dns.com/dns-query'
      ]
    },

    // #endregion ==============================================================
    
    // #region ====== nameserver ===============================================

    // 默认的域名解析服务器
    nameserver: [
      'https://223.5.5.5/dns-query',
      'https://119.29.29.29/dns-query'
    ],

    // #endregion ==============================================================

    // #region ====== fallback =================================================

    // 后备域名解析服务器，一般情况下使用境外 DNS，保证结果可信。
    // 配置 fallback 后默认启用 fallback-filter, geoip-code 为 CN。
    fallback: [
      'https://dns.google/dns-query',
      'https://cloudflare-dns.com/dns-query',
      'tls://8.8.4.4',
      'tls://1.1.1.1'
    ],

    // #endregion ==============================================================

    // #region ====== proxy-server-nameserver ==================================
    
    // 代理节点域名解析服务器，仅用于解析代理节点的域名
    // 如果不填则遵循 nameserver-policy、nameserver 和 fallback 的配置。
    'proxy-server-nameserver': [
      'https://223.5.5.5/dns-query',
      'https://119.29.29.29/dns-query'
    ],

    // #endregion ==============================================================
    
    // #region ====== direct-nameserver ========================================

    // 用于 direct 出口域名解析的 DNS 服务器
    // 如果不填则遵循 nameserver-policy、nameserver 和 fallback 的配置。
    'direct-nameserver': [
      'https://223.5.5.5/dns-query',
      'https://119.29.29.29/dns-query'
    ],

    // #endregion ==============================================================

    // #region ====== direct-nameserver-follow-policy ==========================

    // 是否遵循 nameserver-policy，默认不遵守，仅当 direct-nameserver 不为空时生效。
    'direct-nameserver-follow-policy': false,

    // #endregion ==============================================================
    
    // #region ====== fallback-filter ==========================================

    // 粘贴复制自 OpenClash 相应配置，感谢开发者的付出
    // 后备域名解析服务器，满足条件的将使用 fallback 结果或只使用 fallback 解析。
    'fallback-filter': {
      // 是否启用 geoip 判断
      geoip: true,

      // 可选值为国家缩写，默认值为 CN。
      // 除了 geoip-code 配置的国家 IP，其他的 IP 结果会被视为污染。
      // geoip-code 配置的国家的结果会直接采用，否则将采用 fallback 结果。
      'geoip-code': 'CN',

      // 可选值为对应的 geosite 内包含的集合。
      // geosite 列表的内容被视为已污染
      // 匹配到 geosite 的域名，将只使用 fallback 解析，不去使用 nameserver。
      geosite: [ 'gfw' ],

      // 书写内容为 IP/掩码。
      // 这些网段的结果会被视为污染，
      // nameserver 解析出这些结果时将采用 fallback 的解析结果。
      ipcidr: [
        '::/128','::1/128','2001::/32','0.0.0.0/8','10.0.0.0/8','100.64.0.0/10',
        '127.0.0.0/8','169.254.0.0/16','172.16.0.0/12','192.0.0.0/24',
        '192.0.2.0/24','192.88.99.0/24','192.168.0.0/16','198.18.0.0/15',
        '198.51.100.0/24','203.0.113.0/24','224.0.0.0/4','240.0.0.0/4',
        '255.255.255.255/32'
      ],

      // 这些域名被视为已污染，匹配到这些域名，
      // 会直接使用 fallback 解析，不去使用 nameserver。
      domain: [
        '+.google.com','+.facebook.com','+.youtube.com',
        '+.githubusercontent.com','+.googlevideo.com','+.msftconnecttest.com',
        '+.msftncsi.com'
      ]
    }

    // #endregion ==============================================================
  };

  return config;
}
