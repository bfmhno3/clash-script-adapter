/**
 * Clash/Mihomo 全局转换脚本入口
 * 负责解析原始配置，注入防 DNS 泄露规则和重写分流策略
 * 
 * @param {Object} config - 原始的 Clash/Mihomo 配置对象
 * @param {string} profilename - 当前订阅配置文件的名称
 * @returns {Object} 返回注入了无泄漏配置的全新 config 对象
 */
function main(config, profilename) {
  // 注入全局配置并强制生效
  Object.assign(config, buildGlobalSettings());

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
