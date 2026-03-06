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
  
  // 当 config 中没有任何代理节点时，添加一个 DIRECT 以防止后续配置报错
  const safeProxies = proxyNames.length > 0 ? proxyNames : ['DIRECT'];
  
  // 获取已分组的节点
  const regions = getRegionProxies(safeProxies);

  // 注入全局配置并强制生效
  Object.assign(config, buildGlobalSettings());

  // 配置 DNS 服务，防止 DNS 泄露问题
  config.dns = buildDnsConfig();

  // 使用 Aethersailor 模板的规则
  config['rule-providers'] = buildRuleProviders();

  // 添加代理组
  config['proxy-groups'] = buildProxyGroups(regions, safeProxies);

  // 添加代理规则
  config.rules = buildRules();

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

/**
 * 构建 Clash/Mihomo 的规则提供者配置。
 * 
 * 该函数返回一份动态规则集配置方案，允许通过 HTTP 远程下载和自动更新多个规则集，
 * 包括自定义直连域名、自定义代理域名、Steam CDN、端口分流等规则。
 * 规则提供者支持按需加载和动态更新，无需编辑主配置文件即可管理规则。
 *
 * @returns {Object} 规则提供者配置对象，包含多个规则集的定义
 * @returns {Object} return.Custom_Direct_Domain - 自定义直连域名规则 (behavior: domain)
 * @returns {Object} return.Custom_Direct_Classical_IP - 自定义直连 IP 规则 (behavior: classical)
 * @returns {Object} return.Custom_Proxy_Domain - 自定义代理域名规则 (behavior: domain)
 * @returns {Object} return.Custom_Proxy_Classical_IP - 自定义代理 IP 规则 (behavior: classical)
 * @returns {Object} return.Steam_CDN_Classical - Steam CDN 规则 (behavior: classical)
 * @returns {Object} return.Custom_Port_Direct - 自定义端口直连规则 (behavior: classical)
 */
function buildRuleProviders() {
  // rule-providers 时 mihomo 中一个非常重要的功能，
  // 它允许你动态管理和更新规则集，而不需要每次修改都编辑主配置文件。
  // config['rule-providers'] = {
  //   // name 必须，如 google，不能重复
  //   google: {
  //     // 必须，provider 类型，可选 http/file/inline
  //     type: 'http',

  //     // 可选，文件路径，不可重复，不填写时会使用 url 的 MD5 作为此文件的文件名
  //     // 由于安全问题，此路径将限制只允许在 HomeDir（由启动参数 -d 配置）中，
  //     // 如果想存储到其他位置，请通过设置 SAFE_PATHS 环境变量指定额外的安全路径
  //     // 该环境变量的语法同本操作系统的 PATH 环境变量解析规则（即 Windows 下
  //     // 分号分割，其他系统下以冒号分割）
  //     path: './rule1.yaml',

  //     // 类型为 http，则必须配置
  //     url: 'https://raw.githubusercontent.com/../Google.yaml',

  //     // 更新 provider 的时间，单位为秒
  //     interval: 600,

  //     // 通过指定代理进行下载/更新
  //     proxy: 'DIRECT',

  //     // 行为，可选 domain/ipcidr/classical，
  //     // 对应不同格式的 rule-provider 文件格式，请按实际格式填写
  //     behavior: 'classical',

  //     // 格式，可选 yaml/text/mrs，默认 yaml/
  //     // mrs 目前 behavior 仅支持 domain/ipcidr，可以通过
  //     // mihomo convert-ruleset domain/ipcidr yaml/text XXX.yaml XXX.mrs
  //     // 转换得到
  //     format: 'yaml',

  //     // 限制下载文件的最大大小，默认为 0，即不限制文件大小，单位为字节。
  //     'size-limit': 0,

  //     // 自定义 http 请求头
  //     header: {
  //       'User-Agent': [ 'mihomo/1.18.3' ],
  //       'Authorization': [ 'token 1231231'],
  //     },

  //     // 内容，仅 type 为 inline 时生效
  //     payload: [ 'DOMAIN-SUFFIX,google.com' ]
  //   }
  // };

  const config = {
    'Custom_Direct_Domain': {
      type: 'http',
      behavior: 'domain',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Direct_Domain.yaml',
      path: './rulesets/Custom_Direct_Domain.yaml',
      interval: 28800
    },
    'Custom_Direct_Classical_IP': {
      type: 'http',
      behavior: 'classical',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Direct_Classical_IP.yaml',
      path: './rulesets/Custom_Direct_Classical_IP.yaml',
      interval: 28800
    },
    'Custom_Proxy_Domain': {
      type: 'http',
      behavior: 'domain',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Proxy_Domain.yaml',
      path: './rulesets/Custom_Proxy_Domain.yaml',
      interval: 28800
    },
    'Custom_Proxy_Classical_IP': {
      type: 'http',
      behavior: 'classical',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Proxy_Classical_IP.yaml',
      path: './rulesets/Custom_Proxy_Classical_IP.yaml',
      interval: 28800
    },
    'Steam_CDN_Classical': {
      type: 'http',
      behavior: 'classical',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Steam_CDN_Classical.yaml',
      path: './rulesets/Steam_CDN_Classical.yaml',
      interval: 28800
    },
    'Custom_Port_Direct': {
      type: 'http',
      behavior: 'classical',
      url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Port_Direct.yaml',
      path: './rulesets/Custom_Port_Direct.yaml',
      interval: 28800
    }
  };


  return config;
}

/**
 * 构建 Clash/Mihomo 的代理组 (Proxy Groups) 配置。
 * 
 * 该函数根据预先分类好的地区节点和全局可用节点，生成一组标准化的出站代理策略组。
 * 默认包含“🚀 手动选择”、“♻️ 自动选择”等基础策略，以及按地区（香港、美国、日本、新加坡、台湾、韩国）
 * 划分的专属节点组。每个策略组都配置了相应的测试地址、切换容差等参数，用于后续的流量代理和负载策略。
 *
 * @param {Object} regions - 按地区分类的代理节点对象集合
 * @param {string[]} regions.hk - 香港地区代理节点名称数组
 * @param {string[]} regions.us - 美国地区代理节点名称数组
 * @param {string[]} regions.jp - 日本地区代理节点名称数组
 * @param {string[]} regions.sg - 新加坡地区代理节点名称数组
 * @param {string[]} regions.tw - 台湾地区代理节点名称数组
 * @param {string[]} regions.kr - 韩国地区代理节点名称数组
 * @param {string[]} safeProxies - 所有可用的基础/安全代理节点名称数组（通常排除不可用的或特殊节点，兜底为 ['DIRECT']）
 * @returns {Array<Object>} 生成的代理组配置数组，可直接赋值给 config['proxy-groups']
 */
function buildProxyGroups(regions, safeProxies) {

  // const config = [
  //   {

      // #region ====== name ===================================================

      // 必须,策略组的名字。如有特殊符号，应当使用引号将其包裹
      // name: 'proxy',

      // #endregion ============================================================

      // #region ====== type ===================================================

      // 必须，策略组的类型
      // select：手动选择，如果用户没有指定，则默认选择第一个选项。如果第一个是
      //         策略组，则会选择第一个策略组的第一个选项，直到找到一个非策略组
      //         的选项（节点）作为初始选项
      // url-test：自动选择，定时测试 proxies 字段的选项，选择延迟最低的选项作为
      //           出口
      // fallback：自动回退，当前节点超时时，则会按代理顺序选择第一个可用节点
      // load-balance：负载均衡，定时测试 proxies 字段的选项，平均分配连接到这些
      //               选项上
      // type: 'select',

      // #endregion ============================================================

      // #region ====== proxies ================================================

      // 引入出站代理或其他策略组，填入代理节点或策略组的名称，mihomo 自动查找
      // 默认选择第一个代理或策略组作为初始选项
      // 如果第一个是策略组，则会选择第一个策略组的第一个选项，
      // 直到找到一个非策略组的选项（节点）作为初始选项
      // proxies: [ 'DIRECT', 'ss' ],

      // #endregion ============================================================

      // #region ====== use ====================================================

      // 引入代理集合
      // use: [ 'provider1', 'provider1' ],

      // #endregion ============================================================

      // #region ====== url ====================================================

      // 健康检查测试地址
      // 只会检查代理组的 proxies 字段的代理，
      // 不会检查代理集合（proxy-providers）的代理（通过 use 引入的）
      // url: 'https://www.gstatic.com/generate_204',

      // #endregion ============================================================

      // #region ====== interval ===============================================

      // 健康检查间隔，如不为 0，则启用定时测试，单位为秒
      // interval: 300,

      // #endregion ============================================================

      // #region ====== tolerance ==============================================

      // 当 type 为 url-test 时有效
      // 节点切换容差，单位 ms
      // tolerance: 50,

      // #endregion ============================================================

      // #region ====== lazy ===================================================

      // 懒惰状态，默认为 true，未选择到当前策略组时，不进行测试
      // lazy: true,

      // #endregion ============================================================

      // #region ====== strategy ===============================================

      // 当 type 为 load-balance 时有效
      // 负载均衡策略
      // round-robin：轮询，会把所有的请求分配给策略组内不同的代理节点
      // consistent-hashing：将相同的目标地址的请求分配给策略组内的同一个代理节点
      // stricky-sessions：将相同的来源地址和目标地址的请求分配给策略组内的同一
      //                   个代理节点
      // 目标地址为域名时，使用顶层域名匹配
      // strategy: 'consistent-hashing',

      // #endregion ============================================================

      // #region ====== timeout ================================================

      // 健康检查超时时间，单位为毫秒
      // timeout: 5000,

      // #endregion ============================================================

      // #region ====== max-failed-times =======================================

      // 最大失败次数，超过则触发一次强制健康检查，默认 5
      // 'max-failed-times': 5,

      // #endregion ============================================================

      // #region ====== disable-udp ============================================

      // 禁用该策略组的 UDP
      // 'disable-udp': true,

      // #endregion ============================================================

      // #region ====== interface-name =========================================

      // 代理组中的 interface-name 已弃用，请使用代理节点中的 interface-name
      // 指定策略组的出站接口
      // 优先级：代理节点 > 代理策略 > 全局
      // 'interface-name': 'en0',

      // #endregion ============================================================

      // #region ====== routing-mark ===========================================

      // 代理组中的 routing-mark 已弃用，请使用代理节点中的 routing-mark
      // 策略组出站时附带路由标记
      // 优先级：代理节点 > 代理策略 > 全局
      // 'routing-mark': 11451,

      // #endregion ============================================================

      // #region ====== include-all ============================================

      // 引入所有出站代理以及代理集合，顺序将按照名称排序
      // 引入不包括策略组，可在 proxies 引入其他策略组
      // 'include-all': false,

      // #endregion ============================================================

      // #region ====== include-all-proxies ====================================

      // 引入所有出站代理，顺序将按照名称排序
      // 引入不包括策略组，可在 proxies 引入其他策略组
      // 'include-all-proxies': false,

      // #endregion ============================================================

      // #region ====== include-all-providers ==================================

      // 引入所有代理集合，顺序将按照名称排序
      // 会使引入代理集合失效
      // 'include-all-providers': false,

      // #endregion ============================================================
    
      // #region ====== filter =================================================

      // 筛选满足关键词或正则表达式的节点，可以使用 ` 区分多个正则表达式
      // 仅用于引入代理集合以及引入所有出站代理
      // filter: '(?i)港|hk|hongkong|hong kong',

      // #endregion ============================================================

      // #region ====== exclude-filter =========================================

      // 排序满足关键词或正则表达式的节点，可以使用 ` 区分多个正则表达式
      // 'exclude-filter': '美|日',

      // #endregion ============================================================

      // #region ====== exclude-type ===========================================

      // 不支持正则表达式，通过 | 分割，根据节点类型排序，仅排序引入出站代理
      // 支持类型请参阅
      // https://github.com/MetaCubeX/mihomo/blob/
      // fbead56ec97ae93f904f4476df1741af718c9c2a/constant/adapters.go#L18-L45
      // 'exclude-type': 'Shadowsocks|Http',

      // #endregion ============================================================

      // #region ====== hidden =================================================

      // 在 API 返回 hidden 状态，以隐藏该策略组展示（需要使用 API 的前端适配）
      // hidden: true,

      // #endregion ============================================================

      // #region ====== icon ===================================================

      // 在 API 返回 icon 所输入的字符串，以在该策略组显示
      //（需要使用 API 的前端适配）
      // icon: 'xxx'

      // #endregion ============================================================

  //   },
  // ];

  const { hk, us, jp, sg, tw, kr } = regions;

  const baseGroups = [
    '🚀 手动选择','♻️ 自动选择','🇭🇰 香港节点','🇺🇸 美国节点','🇯🇵 日本节点',
    '🇸🇬 新加坡节点','🇼🇸 台湾节点', '🇰🇷 韩国节点'
  ];

  const config = [
    {
      name: '♻️ 自动选择',
      type: 'url-test',
      url: 'https://cp.cloudflare.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: safeProxies
    },
    {
      name: '🇯🇵 日本节点',
      type: 'url-test',
      url: 'https://cp.cloudflare.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: jp
    },
    {
      name: '🇺🇸 美国节点',
      type: 'url-test',
      url: 'https://cp.cloudflare.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: us
    },
    {
      name: '🇭🇰 香港节点',
      type: 'url-test',
      url: 'https://cp.cloudflare.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: hk
    },
    {
      name:
      '🇸🇬 新加坡节点',
      type: 'url-test',
      url: 'https://cp.cloudflare.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: sg
    },
    {
      name: '🇼🇸 台湾节点',
      type: 'url-test',
      url: 'https://cp.cloudflare.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: tw
    },
    {
      name: '🇰🇷 韩国节点',
      type: 'url-test',
      url: 'https://cp.cloudflare.com/generate_204',
      interval: 300,
      tolerance: 50,
      proxies: kr
    },
    {
      name: '🎯 全球直连',
      type: 'select',
      proxies: ['DIRECT']
    },
    {
      name: '🚀 手动选择',
      type: 'select',
      proxies: [
        '♻️ 自动选择','🇭🇰 香港节点','🇺🇸 美国节点','🇯🇵 日本节点','🇸🇬 新加坡节点',
        '🇼🇸 台湾节点','🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '💬 即时通讯',
      type: 'select',
      proxies: [...baseGroups, '🎯 全球直连']
    },
    {
      name: '🌐 社交媒体',
      type: 'select',
      proxies: [...baseGroups, '🎯 全球直连', ...safeProxies]
    },
    {
      name: '🚀 GitHub',
      type: 'select',
      proxies: [...baseGroups, '🎯 全球直连']
    },
    {
      name: '🤖 ChatGPT',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🇸🇬 新加坡节点','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点','🇼🇸 台湾节点','🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '🤖 AI服务',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🇸🇬 新加坡节点','🇭🇰 香港节点',
        '🇺🇸 美国节点', '🇯🇵 日本节点', '🇼🇸 台湾节点', '🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '🎶 TikTok',
      type: 'select',
      proxies: [...baseGroups, ...safeProxies]
    },
    {
      name: '📹 YouTube',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🇸🇬 新加坡节点','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点','🇼🇸 台湾节点','🇰🇷 韩国节点', ...safeProxies
      ]
    },
    {
      name: '🎥 Netflix',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🇸🇬 新加坡节点','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点','🇼🇸 台湾节点','🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '🎥 DisneyPlus',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🇸🇬 新加坡节点','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点','🇼🇸 台湾节点','🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '🎥 HBO',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🇸🇬 新加坡节点','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点','🇼🇸 台湾节点','🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '🎥 PrimeVideo',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🇸🇬 新加坡节点','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点','🇼🇸 台湾节点','🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '🎥 AppleTV+',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🇸🇬 新加坡节点','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点','🇼🇸 台湾节点','🇰🇷 韩国节点','🎯 全球直连', ...safeProxies
      ]
    },
    {
      name: '🎥 Emby',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🎯 全球直连','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点','🇸🇬 新加坡节点','🇼🇸 台湾节点','🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '🎻 Spotify',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🎯 全球直连','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点','🇸🇬 新加坡节点','🇼🇸 台湾节点','🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '📺 Bahamut',
      type: 'select',
      proxies: ['🇼🇸 台湾节点', '🚀 手动选择', '🎯 全球直连', ...safeProxies]
    },
    {
      name: '🌎 国外媒体',
      type: 'select',
      proxies: [...baseGroups, ...safeProxies]
    },
    {
      name: '🛒 国外电商',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🎯 全球直连','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点','🇸🇬 新加坡节点','🇼🇸 台湾节点','🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '📢 谷歌FCM',
      type: 'select',
      proxies: baseGroups
    },
    {
      name:
      '🇬 谷歌服务',
      type: 'select',
      proxies: [...baseGroups, ...safeProxies]
    },
    {
      name: '🍎 苹果服务',
      type: 'select',
      proxies: ['🎯 全球直连', ...baseGroups, ...safeProxies]
    },
    {
      name: 'Ⓜ️ 微软服务',
      type: 'select',
      proxies: ['🎯 全球直连', ...baseGroups, ...safeProxies]
    },
    {
      name: '🎮 游戏平台',
      type: 'select',
      proxies: ['🎯 全球直连', ...baseGroups, ...safeProxies] 
    },
    {
      name: '🎮 Steam',
      type: 'select',
      proxies: ['🎯 全球直连', ...baseGroups, ...safeProxies]
    },
    {
      name: '🚀 测速工具',
      type: 'select',
      proxies: ['🎯 全球直连', ...baseGroups, ...safeProxies]
    },
    {
      name: '🐟 漏网之鱼',
      type: 'select',
      proxies: [
        '🚀 手动选择','♻️ 自动选择','🎯 全球直连','🇭🇰 香港节点','🇺🇸 美国节点',
        '🇯🇵 日本节点', '🇸🇬 新加坡节点', '🇼🇸 台湾节点', '🇰🇷 韩国节点',...safeProxies
      ]
    },
    {
      name: '🔀 非标端口',
      type: 'select',
      proxies: ['🐟 漏网之鱼', '🎯 全球直连']
    }
  ];

  return config;
}

/**
 * 构建 Clash/Mihomo 的分流规则 (Routing Rules) 配置。
 * 
 * 该函数返回一份完整的分流规则数组，路由引擎会从上到下按严格优先级匹配。
 * 规则涵盖了本地局域网防泄露、自定义直连与代理规则集、常见应用与网站的 GeoSite/GeoIP 分流
 * （如：游戏、社交媒体、AI 服务、流媒体、电商等），最终以国内服务直连和兜底规则（漏网之鱼）
 * 处理未匹配的流量，实现精准且高效的网络分流。
 *
 * @returns {string[]} 分流规则配置数组。每条规则遵循 `类型,匹配内容,策略组[,额外参数]` 的格式
 */
function buildRules() {
  const config = [
    'GEOSITE,private,🎯 全球直连',
    'GEOIP,private,🎯 全球直连,no-resolve',
    'RULE-SET,Custom_Direct_Domain,🎯 全球直连',
    'RULE-SET,Custom_Direct_Classical_IP,🎯 全球直连',
    'RULE-SET,Custom_Proxy_Domain,🚀 手动选择',
    'RULE-SET,Custom_Proxy_Classical_IP,🚀 手动选择',
    'GEOSITE,google-cn,🎯 全球直连',
    'GEOSITE,category-games@cn,🎯 全球直连',
    'RULE-SET,Steam_CDN_Classical,🎯 全球直连',
    'GEOSITE,category-game-platforms-download,🎯 全球直连',
    'GEOSITE,category-public-tracker,🎯 全球直连',
    'GEOSITE,category-communication,💬 即时通讯',
    'GEOSITE,category-social-media-!cn,🌐 社交媒体',
    'GEOSITE,openai,🤖 ChatGPT',
    'GEOSITE,category-ai-!cn,🤖 AI服务',
    'GEOSITE,github,🚀 GitHub',
    'GEOSITE,category-speedtest,🚀 测速工具',
    'GEOSITE,steam,🎮 Steam',
    'GEOSITE,youtube,📹 YouTube',
    'GEOSITE,apple-tvplus,🎥 AppleTV+',
    'GEOSITE,apple,🍎 苹果服务',
    'GEOSITE,microsoft,Ⓜ️ 微软服务',
    'GEOSITE,googlefcm,📢 谷歌FCM',
    'GEOSITE,google,🇬 谷歌服务',
    'GEOSITE,tiktok,🎶 TikTok',
    'GEOSITE,netflix,🎥 Netflix',
    'GEOSITE,disney,🎥 DisneyPlus',
    'GEOSITE,hbo,🎥 HBO',
    'GEOSITE,primevideo,🎥 PrimeVideo',
    'GEOSITE,category-emby,🎥 Emby',
    'GEOSITE,spotify,🎻 Spotify',
    'GEOSITE,bahamut,📺 Bahamut',
    'GEOSITE,category-games,🎮 游戏平台',
    'GEOSITE,category-entertainment,🌎 国外媒体',
    'GEOSITE,category-ecommerce,🛒 国外电商',
    'GEOSITE,gfw,🚀 手动选择',
    'GEOIP,telegram,💬 即时通讯,no-resolve',
    'GEOIP,twitter,🌐 社交媒体,no-resolve',
    'GEOIP,facebook,🌐 社交媒体,no-resolve',
    'GEOIP,google,🇬 谷歌服务,no-resolve',
    'GEOIP,netflix,🎥 Netflix,no-resolve',
    'GEOSITE,cn,🎯 全球直连',
    'GEOIP,cn,🎯 全球直连,no-resolve',
    'RULE-SET,Custom_Port_Direct,🔀 非标端口',
    'MATCH,🐟 漏网之鱼'
  ];

  return config;
}
