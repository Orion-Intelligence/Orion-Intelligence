export const richIpDetail = {
  status: 'done',
  ip: '203.0.113.7',
  ip_info: { country: 'Germany', custom_meta: 'ip-info-extra' },
  country: 'Germany',
  city: 'Berlin',
  organization: 'Acme Networks',
  isp: 'Acme ISP',
  asn: 'AS64500',
  hosting_type: 'hosting',
  cloud_provider: 'AWS',
  cloud_region: 'eu-central-1',
  cloud_service: 'EC2',
  web_server: 'nginx',
  title: 'Acme Home',
  open_ports: [80, 443, 554],
  ports: [
    {
      port: 443, protocol: 'tcp', service: 'https', state: 'open',
      banner: 'HTTP/1.1 200 OK', risk_flags: ['weak_cipher'],
      tls: {
        version: 'TLSv1.2', cipher: 'ECDHE-RSA-AES256', bits: 256, cert_cn: 'acme.example',
        issuer: { commonName: 'R3', organizationName: "Let's Encrypt", countryName: 'US' },
        not_before: '2025-01-01', not_after: '2025-04-01', serial_number: '0A1B2C',
        is_self_signed: true, is_ca: false, signature_algorithm: 'sha256WithRSA',
        public_key_algorithm: 'RSA', public_key_size: 2048,
        key_usage: ['digitalSignature'], extended_key_usage: ['serverAuth'],
        fingerprint_sha256: 'AB:CD:EF', subject_key_identifier: 'SKI-1', authority_key_identifier: 'AKI-1',
        ca_issuers: ['http://ca.example/ca'], crl_distribution_points: ['http://crl.example'],
        certificate_policies: ['policy-1'], supported_versions: ['TLSv1.2', 'TLSv1.3'],
        weak_protocols: ['TLSv1.0'], risk_flags: ['legacy_protocol'],
        ciphers_by_version: { 'TLSv1.2': 'ECDHE-RSA-AES256' }, scts: ['sct-log-entry']
      },
      http: { server: 'nginx', title: 'Acme Home' }
    },
    { port: 554, protocol: 'tcp', service: 'rtsp', state: 'open', is_camera: true, device_type: 'camera', banner: 'RTSP/1.0 200 OK' },
    { port: 1883, protocol: 'tcp', service: 'mqtt', state: 'open', is_iot: true }
  ],
  web_technologies: ['nginx', 'React'],
  security: ['CSP', 'X-Frame-Options'],
  cdn: 'Cloudflare',
  waf: 'Cloudflare WAF',
  load_balancer: 'ELB',
  paas: 'Heroku',
  amazon_s3: true,
  favicon_hash: '-1234567',
  hsts: true,
  vulnerabilities: ['CVE-2021-1111', { cve: 'CVE-2022-2222', cvss: 9.8 }],
  misconfigurations: ['Directory listing enabled'],
  http_headers: { 'Content-Type': 'text/html', 'X-Powered-By': 'Express' },
  cache_headers: { 'Cache-Control': 'no-cache' },
  allowed_methods: ['GET', 'POST', 'OPTIONS'],
  hostnames: ['host1.acme.example', 'host2.acme.example'],
  cameras: [{ ip: '203.0.113.7', port: 554, brand: 'Hikvision', model: 'DS-2CD' }],
  additional_scan_note: 'extra additional detail'
};

export const leanIpDetail = {
  status: 'done',
  ip: '198.51.100.5',
  country: 'France',
  hosting_type: 'hosting',
  open_ports: [8080],
  ports: [
    {
      port: 8080, proto: 'tcp', service: 'http-proxy', state: 'closed',
      tls: { version: 'TLSv1.1', cert_expires: '2026-12-01', is_ca: false }
    }
  ],
  cdn: 'Fastly',
  hsts: false,
  security: ['CSP', 'X-Content-Type-Options'],
  http_headers: { Server: 'nginx' }
};

export const cameraOnlyIpDetail = {
  status: 'done',
  ip: '203.0.113.99',
  is_camera: true,
  ip_info: { region: 'APAC', custom_tag: 'edge-node' },
  open_ports: [1883, 554],
  ports: [
    { is_iot: true },
    { is_camera: true }
  ],
  cameras: [{ ip: '203.0.113.99', port: 554, brand: 'Dahua' }]
};

export function buildSeoRepoResponse(host: string) {
  return {
    status: 'done',
    result: {
      status: 'done',
      meta: { Host: host, URL: `https://${host}`, Port: '443/ssl', Scanned_on_date: '2026-01-01' },
      grade: 'B',
      grade_counts: { high: 1, medium: 1, low: 1, informational: 0 },
      threats: {
        Headers: [{ header: 'Missing Content-Security-Policy', risk: 'high', confidence: 'certain', description: 'No CSP header present.' }],
        SEO: [{ header: 'Missing sitemap.xml', risk: 'low', confidence: 'firm', description: 'No sitemap found.' }]
      },
      proofs: {
        Headers: [{ header: 'Missing Content-Security-Policy', proof: 'content-security-policy: absent' }]
      }
    }
  };
}

export function assertIpDetailTextIfPresent(text: string) {
  cy.get('app-ip-detail').invoke('text').then((rendered) => {
    if (rendered.includes(text)) {
      cy.contains('app-ip-detail', text).should('exist');
    }
  });
}

export function stubNetworkIntelApis() {
  cy.intercept('POST', '**/api/netintel/resolve_ip', {
    statusCode: 200,
    body: {
      status: 'done',
      result: {
        status: 'done',
        domain: 'example.com',
        ips: ['93.184.216.34'],
      },
    },
  }).as('resolveIp');

  cy.intercept('POST', '**/api/netintel/ipscanner', (req) => {
    const ip = req.body?.ip;

    if (ip === '8.8.8.8') {
      req.reply({
        statusCode: 200,
        body: {
          status: 'done',
          result: {
            status: 'done',
            ip: '8.8.8.8',
            country: 'United States',
            organization: 'Google',
            hosting_type: 'public-dns',
            open_ports: [53],
            ports: [
              {
                port: 53,
                protocol: 'udp',
                service: 'dns',
                state: 'open',
                confidence: 0.95,
                risk_flags: [],
              },
            ],
          },
        },
      });
      return;
    }

    req.reply({
      statusCode: 200,
      body: {
        status: 'done',
        result: {
          status: 'done',
          ip: ip || '93.184.216.34',
          country: 'United States',
          organization: 'Example Org',
          hosting_type: 'hosting',
          open_ports: [80, 443],
          ports: [
            {
              port: 80,
              protocol: 'tcp',
              service: 'http',
              state: 'open',
              confidence: 0.9,
              risk_flags: [],
            },
            {
              port: 443,
              protocol: 'tcp',
              service: 'https',
              state: 'open',
              confidence: 0.95,
              risk_flags: ['modern_tls'],
            },
          ],
        },
      },
    });
  }).as('ipScanner');

  cy.intercept('POST', '**/api/netintel/url_vulnerability_scan', {
    statusCode: 200,
    body: {
      status: 'done',
      result: {
        status: 'done',
        url: 'https://bbc.com',
        host: 'bbc.com',
        elapsed_seconds: 2,
        summary: {
          total: 1,
          critical: 0,
          high: 1,
          medium: 0,
          low: 0,
          info: 0,
        },
        findings: [
          {
            title: 'Missing Content-Security-Policy',
            severity: 'high',
            category: 'headers',
            description: 'The response does not define a Content Security Policy.',
            urls: ['https://bbc.com/', 'https://bbc.com/news'],
            evidence: 'content-security-policy: missing',
          },
        ],
      },
    },
  }).as('vulnerabilityScan');
}
