/**
 * 构建 TUN 透明代理配置，根据平台应用差异化参数。
 * @param {'windows'|'macos'|'linux'|'android'|'unknown'} platform
 */
export function buildTunConfig(platform) {
  const config = {
    enable: true,
    stack: 'mixed',                // TCP 用 system 栈，UDP 用 gvisor 栈（兼容性最佳）
    'auto-route': true,            // 自动设置全局路由
    'auto-detect-interface': true, // 自动选择出口接口
    'dns-hijack': ['any:53', 'tcp://any:53'],  // 劫持所有 DNS 请求
    mtu: 9000,
    'strict-route': true,          // 严格路由，防止 DNS 泄露（Windows 最需要）
    'udp-timeout': 300,            // UDP NAT 过期时间（秒）
    'endpoint-independent-nat': false,
    'route-address': [             // 路由全量 IPv4/IPv6 流量进 TUN
      '0.0.0.0/1', '128.0.0.0/1', '::/1', '8000::/1',
    ],
    'route-exclude-address': ['192.168.0.0/16', 'fc00::/7'],  // 排除局域网
  };

  // Linux/Android: 通过 iptables/nftables 重定向 TCP 连接
  if (platform === 'linux' || platform === 'android') {
    config['auto-redirect'] = true;
  }

  // Linux only: 通用分段卸载优化（提升大包性能）
  if (platform === 'linux') {
    config['gso'] = true;
    config['gso-max-size'] = 65536;
  }

  // Android: 包含两个用户空间（主用户 + 工作配置文件）
  if (platform === 'android') {
    config['include-android-user'] = ['0', '10'];
  }

  return config;
}

/**
 * 构建流量嗅探配置。
 * 通过 HTTP/TLS/QUIC 协议识别真实域名，提升仅 IP 访问场景的分流命中率。
 */
export function buildSnifferConfig() {
  return {
    enable: true,
    'force-dns-mapping': true,       // 对 Redir-Host 类型流量强制嗅探
    'parse-pure-ip': true,           // 对无域名的流量强制嗅探
    'override-destination': true,    // 用嗅探结果覆盖目标地址
    sniff: {
      HTTP: {
        ports: [80, '8080-8880'],
        'override-destination': true,
      },
      TLS: {
        ports: [443, 8443],
      },
      QUIC: {
        ports: [443],
      },
    },
    // 强制嗅探的域名（这些服务可能仅通过 IP 连接）
    'force-domain': [
      '+.netflix.com','+.amazonaws.com','+.media.dssott.com','+.v2ex.com',
    ],
    // 跳过嗅探的域名（IoT 设备、Apple Push 等不需要嗅探）
    'skip-domain': [
      'Mijia Cloud',
      'dlg.io.mi.com',
      '+.oray.com',
      '+.sunlogin.net',
      '+.push.apple.com',
    ],
  };
}
