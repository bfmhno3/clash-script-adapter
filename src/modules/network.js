/**
 * Build TUN config with platform-specific adaptations.
 * @param {'windows'|'macos'|'linux'|'android'|'unknown'} platform
 */
export function buildTunConfig(platform) {
  const config = {
    enable: true,
    stack: 'mixed',
    'auto-route': true,
    'auto-detect-interface': true,
    'dns-hijack': ['any:53', 'tcp://any:53'],
    mtu: 9000,
    'strict-route': true,
    'udp-timeout': 300,
    'endpoint-independent-nat': false,
    'route-address': [
      '0.0.0.0/1', '128.0.0.0/1', '::/1', '8000::/1',
    ],
    'route-exclude-address': ['192.168.0.0/16', 'fc00::/7'],
  };

  // Linux/Android: auto-redirect for iptables/nftables
  if (platform === 'linux' || platform === 'android') {
    config['auto-redirect'] = true;
  }

  // Linux only: GSO optimization
  if (platform === 'linux') {
    config['gso'] = true;
    config['gso-max-size'] = 65536;
  }

  // Android: include both user spaces
  if (platform === 'android') {
    config['include-android-user'] = ['0', '10'];
  }

  return config;
}

export function buildSnifferConfig() {
  return {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': true,
    'override-destination': true,
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
    'force-domain': [
      '+.netflix.com','+.amazonaws.com','+.media.dssott.com','+.v2ex.com',
    ],
    'skip-domain': [
      'Mijia Cloud',
      'dlg.io.mi.com',
      '+.oray.com',
      '+.sunlogin.net',
      '+.push.apple.com',
    ],
  };
}
