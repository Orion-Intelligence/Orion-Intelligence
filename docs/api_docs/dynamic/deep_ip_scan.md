# Dynamic: Deep_ip_scan

## Description

Perform comprehensive network reconnaissance on a target IP address using advanced port scanning, service fingerprinting, and security analysis.

The request is an HTTP POST and expects a JSON body matching the `IPScanRequest` schema:

```json
{
  "ip": "52.211.48.174"
}
```

Fields:
- **ip** — target IPv4 address to scan (e.g. `52.211.48.174`, `192.168.1.1`)

Payload example:

```json
{
  "ip": "52.211.48.174"
}
```

## Response

Comprehensive scan results returned as a JSON object with a top-level **result** field.

### Response Structure

- **ip** — scanned IP address (e.g. `52.211.48.174`)
- **hostnames** — list of reverse DNS hostnames mapped to the IP (e.g. `["ec2-52-211-48-174.eu-west-1.compute.amazonaws.com"]`)

#### Geolocation & Infrastructure
- **country** — country name (e.g. `Ireland`)
- **city** — city name (e.g. `Dublin`)
- **organization** — organization name (e.g. `AWS EC2 (eu-west-1)`)
- **isp** — Internet Service Provider (e.g. `Amazon.com, Inc.`)
- **asn** — Autonomous System Number (e.g. `AS16509 Amazon.com, Inc.`)

#### Cloud Provider Detection
- **cloud_provider** — identified cloud platform (e.g. `Amazon Web Services`, `Google Cloud Platform`, `Microsoft Azure`, `Cloudflare`, `DigitalOcean`, `Linode`, `Oracle Cloud Infrastructure`)
- **cloud_region** — cloud region identifier (e.g. `eu-west-1`, `us-east-1`)
- **cloud_service** — specific cloud service (e.g. `EC2`, `CloudFront CDN`, `Elastic Load Balancer`, `S3`)
- **hosting_type** — infrastructure classification (`hosting`, `residential`, `unknown`)

#### Web Intelligence
- **web_technologies** — detected web technologies (e.g. `["Apache HTTP Server", "PHP", "WordPress", "Nginx"]`)
- **web_server** — HTTP server software and version (e.g. `Apache/2.4.41 (Ubuntu)`)
- **title** — HTML page title (e.g. `BBC Account`)
- **favicon_hash** — MurmurHash3 hash of favicon.ico (e.g. `-1234567890`)
- **hsts** — HSTS (HTTP Strict Transport Security) enabled (boolean)

#### Security & Content Delivery
- **security** — list of detected security mechanisms (e.g. `["HSTS"]`)
- **cdn** — Content Delivery Network provider (e.g. `Cloudflare`, `Amazon CloudFront`, `Fastly`, `Akamai`, `Varnish`)
- **waf** — Web Application Firewall (e.g. `Cloudflare`, `Generic WAF`)
- **paas** — Platform as a Service (e.g. `Vercel`, `Heroku`, `Amazon Web Services`)
- **amazon_s3** — Amazon S3 bucket detected (boolean)
- **load_balancer** — Load balancer type (e.g. `Amazon ELB`)

#### HTTP Details
- **http_headers** — map of important HTTP response headers:
  - **Server** — server software (e.g. `Apache`)
  - **X-Powered-By** — backend technology (e.g. `PHP/7.4.3`)
  - **X-Frame-Options** — clickjacking protection (e.g. `DENY`, `SAMEORIGIN`)
  - **Content-Security-Policy** — CSP directives
  
- **cache_headers** — caching-related headers:
  - **Cache-Control** — cache directives (e.g. `no-cache,private,no-store`)
  - **Fastcgi-Cache** — FastCGI cache status
  - **X-Cache** — proxy cache status (e.g. `HIT`, `MISS`)
  
- **link_headers** — HTTP Link header values (e.g. `["<https://api.example.com>; rel=preconnect"]`)
- **allowed_methods** — HTTP methods returned by OPTIONS (e.g. `["GET", "POST", "HEAD", "OPTIONS"]`)
- **cookies** — list of cookies with security attributes:
  - **name** — cookie name
  - **secure** — secure flag (boolean)
  - **httponly** — httponly flag (boolean)

#### Vulnerabilities & Misconfigurations
- **vulnerabilities** — list of detected CVEs and security issues (each containing `cve`, `severity`, `description`)
- **misconfigurations** — list of security misconfigurations (e.g. `["redis_no_auth", "ftp_anonymous_login", "exposed_mysql"]`)

#### Camera Detection
- **cameras** — list of detected IP cameras:
  - **is_camera** — camera detected (boolean)
  - **brand** — manufacturer (e.g. `Hikvision`, `Dahua`, `Axis`, `Bosch`)
  - **model_hint** — model identifier (e.g. `webcamXP`, `DVR/NVR`)
  - **detection_method** — detection technique (`banner`, `http_headers`, `page_title`, `path_probe`, `onvif`, `port_signature`)
  - **camera_path** — discovered endpoint (e.g. `/ISAPI/System/deviceInfo`)
  - **path_status** — HTTP status code (e.g. `200`, `401`)
  - **port** — port number
  - **service** — service name (e.g. `https`, `rtsp`)
  
- **is_camera** — at least one camera detected (boolean)

#### Open Ports Summary
- **open_ports** — list of all open port numbers (e.g. `[22, 80, 443]`)

#### Port Details
- **ports** — list of detailed port scan results, each containing:

  **Basic Port Info:**
  - **port** — port number (e.g. `443`)
  - **protocol** — transport protocol (always `tcp`)
  - **service** — identified service (e.g. `https`, `ssh`, `mysql`, `redis`, `http`, `ftp`)
  - **state** — port state (always `open` for returned ports)
  - **protocol_verified** — service confirmed via protocol handshake (boolean)
  - **banner** — raw service banner (e.g. `SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5`)

  **Software Identification:**
  - **cpe** — Common Platform Enumeration string (e.g. `cpe:/a:openbsd:openssh:8.2p1`)
  - **product** — software product name (e.g. `openssh`)
  - **version** — software version (e.g. `8.2p1`)
  - **vendor** — software vendor (e.g. `openbsd`)
  - **additional_cpes** — list of additional CPE strings when multiple software detected in banner

  **TLS/SSL Certificate Details** (for HTTPS/SMTPS/IMAPS/POP3S ports):
  - **tls** — TLS certificate and configuration:
    - **version** — TLS version (e.g. `TLSv1.3`, `TLSv1.2`)
    - **cipher** — cipher suite (e.g. `TLS_AES_256_GCM_SHA384`, `ECDHE-RSA-AES128-GCM-SHA256`)
    - **bits** — key strength in bits (e.g. `256`, `128`)
    - **cert_cn** — certificate Common Name (e.g. `*.bbc.com`)
    - **cert_expires** — expiration date (e.g. `May 07 23:59:59 2026 GMT`)
    - **subject** — certificate subject distinguished name (e.g. `{commonName: "*.bbc.com", organizationName: "British Broadcasting Corporation"}`)
    - **issuer** — certificate issuer (e.g. `{commonName: "DigiCert TLS RSA SHA256 2020 CA1", organizationName: "DigiCet Inc"}`)
    - **san** — Subject Alternative Names (e.g. `[("DNS", "*.bbc.com"), ("DNS", "bbc.com")]`)
    - **fingerprint_sha256** — SHA-256 fingerprint of certificate
    - **is_self_signed** — self-signed certificate (boolean)
    - **not_before** — validity start date
    - **not_after** — validity end date
    - **serial_number** — certificate serial number (e.g. `0a:b2:c3:d4:e5`)
    - **signature_algorithm** — signature algorithm (e.g. `sha256WithRSAEncryption`)
    - **public_key_algorithm** — public key type (e.g. `RSA`, `ECDSA`)
    - **public_key_size** — public key size in bits (e.g. `2048`, `256`)
    - **key_usage** — key usage extensions (e.g. `["Digital Signature", "Key Encipherment"]`)
    - **extended_key_usage** — extended key usage (e.g. `["TLS Web Server Authentication", "TLS Web Client Authentication"]`)
    - **authority_key_identifier** — AKI extension (e.g. `55:D9:18:5F:D2:1C`)
    - **subject_key_identifier** — SKI extension
    - **ca_issuers** — CA issuer URLs (e.g. `["http://crt.r2m03.amazontrust.com/r2m03.cer"]`)
    - **crl_distribution_points** — CRL URLs (e.g. `["http://crl.r2m03.amazontrust.com/r2m03.crl"]`)
    - **certificate_policies** — policy OIDs (e.g. `["2.23.140.1.2.1"]`)
    - **is_ca** — CA certificate (boolean)
    - **scts** — Certificate Transparency logs (list of `{version, log_id, timestamp}`)
    - **supported_versions** — all supported TLS versions (e.g. `["TLSv1.2", "TLSv1.3"]`)
    - **ciphers_by_version** — cipher suites per TLS version (e.g. `{TLSv1.2: {cipher: "...", bits: 128}}`)
    - **weak_protocols** — list of obsolete TLS versions (e.g. `["TLSv1.0", "TLSv1.1"]`)

  **SSH Fingerprint Details** (for SSH ports):
  - **ssh_fingerprint** — SSH server configuration:
    - **host_key_type** — key algorithm (e.g. `ssh-rsa`, `ecdsa-sha2-nistp256`, `ssh-ed25519`)
    - **host_key** — base64-encoded public key
    - **fingerprint** — MD5 fingerprint (e.g. `aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99`)
    - **kex_algorithms** — key exchange algorithms (e.g. `["curve25519-sha256", "ecdh-sha2-nistp256"]`)
    - **server_host_key_algorithms** — supported host key types (e.g. `["rsa-sha2-512", "ssh-ed25519"]`)
    - **encryption_algorithms** — supported ciphers (e.g. `["aes128-ctr", "aes256-gcm@openssh.com"]`)
    - **mac_algorithms** — MAC algorithms (e.g. `["hmac-sha2-256", "hmac-sha2-512"]`)
    - **compression_algorithms** — compression methods (e.g. `["none", "zlib@openssh.com"]`)

  **Protocol-Specific Data:**
  - **protocol_info** — service-specific metadata (for MySQL, Redis, etc.):
    - MySQL: `{version: "8.0.32", protocol: 10}`
    - Redis: `{redis_version: "7.0.5", os: "Linux", tcp_port: "6379"}`

  **Security Analysis:**
  - **misconfigurations** — list of detected security issues (e.g. `["redis_no_auth", "exposed_mongodb", "ftp_anonymous_login"]`)
  - **risk_flags** — list of security risk indicators:
    - `obsolete_tls_version` — TLSv1.0/1.1 support
    - `weak_cipher_algorithm` — RC4 or broken ciphers
    - `weak_cipher_strength` — <128-bit encryption
    - `self_signed_certificate` — untrusted certificate
    - `expired_tls_certificate` — expired certificate
    - `exposed_admin_or_db_port` — sensitive ports (22, 3306, 3389, 5432)
    - `plaintext_http` — unencrypted HTTP
    - `exposed_camera` — IP camera detected
    - `exposed_camera_stream` — RTSP stream exposed
    - `exposed_dahua_device` — Dahua DVR/NVR
    - `strong_tls` — TLSv1.2 properly configured
    - `modern_tls` — TLSv1.3 enabled
    - `known_cve_detected` — CVE match found
    - `supports_TLSv1.0` — obsolete protocol support
    - `supports_TLSv1.1` — obsolete protocol support
  
  - **confidence** — risk assessment confidence score (0.0-1.0, e.g. `0.85`)
  - **severity_score** — vulnerability severity (0-10 CVSS scale)

  **Camera Detection** (if camera identified on this port):
  - **camera** — camera details (same structure as top-level cameras array)

## Example Response

### Standard Web Server Scan

```json
{
  "ip": "52.211.48.174",
  "hostnames": ["ec2-52-211-48-174.eu-west-1.compute.amazonaws.com"],
  "country": "Ireland",
  "city": "Dublin",
  "organization": "AWS EC2 (eu-west-1)",
  "isp": "Amazon.com, Inc.",
  "asn": "AS16509 Amazon.com, Inc.",
  "cloud_provider": "Amazon Web Services",
  "cloud_region": "eu-west-1",
  "cloud_service": "EC2",
  "hosting_type": "hosting",
  "web_technologies": ["Apache HTTP Server"],
  "vulnerabilities": [],
  "misconfigurations": [],
  "security": ["HSTS"],
  "cdn": null,
  "waf": null,
  "paas": null,
  "amazon_s3": false,
  "load_balancer": null,
  "hsts": true,
  "web_server": "Apache",
  "favicon_hash": null,
  "allowed_methods": [],
  "cookies": [],
  "title": "BBC Account",
  "http_headers": {
    "Server": "Apache",
    "X-Powered-By": null,
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "base-uri 'self';frame-src https://www.bbc.com;..."
  },
  "cache_headers": {
    "Cache-Control": "no-cache,private,no-store",
    "Fastcgi-Cache": null,
    "X-Cache": null
  },
  "link_headers": [],
  "cameras": [],
  "is_camera": false,
  "open_ports": [443],
  "ports": [
    {
      "port": 443,
      "protocol": "tcp",
      "service": "https",
      "banner": null,
      "state": "open",
      "protocol_verified": true,
      "cpe": null,
      "misconfigurations": [],
      "tls": {
        "version": "TLSv1.3",
        "cipher": "TLS_AES_256_GCM_SHA384",
        "bits": 256,
        "cert_cn": "*.bbc.co.uk",
        "cert_expires": "Mar 15 23:59:59 2026 GMT",
        "subject": {
          "commonName": "*.bbc.co.uk",
          "organizationName": "British Broadcasting Corporation"
        },
        "issuer": {
          "commonName": "DigiCert TLS RSA SHA256 2020 CA1",
          "organizationName": "DigiCert Inc",
          "countryName": "US"
        },
        "san": [
          ["DNS", "*.bbc.co.uk"],
          ["DNS", "bbc.co.uk"]
        ],
        "fingerprint_sha256": "d2291cfc03dd3199671d9300fa80da8373f3dc74bf482ea9544e23bd5546e00a",
        "is_self_signed": false,
        "not_before": "Apr 07 00:00:00 2025 GMT",
        "not_after": "Mar 15 23:59:59 2026 GMT",
        "serial_number": "0a:b2:5f:d6:ee:4b:67:52",
        "signature_algorithm": "sha256WithRSAEncryption",
        "public_key_algorithm": "RSA",
        "public_key_size": 2048,
        "key_usage": ["Digital Signature", "Key Encipherment"],
        "extended_key_usage": [
          "TLS Web Server Authentication",
          "TLS Web Client Authentication"
        ],
        "authority_key_identifier": "55:D9:18:5F:D2:1C:CC:01",
        "subject_key_identifier": "80:46:88:14:CD:E1:78:4B",
        "ca_issuers": ["http://crt.digicert.com/DigiCertTLSRSASHA2562020CA1.crt"],
        "crl_distribution_points": [
          "http://crl3.digicert.com/DigiCertTLSRSASHA2562020CA1.crl"
        ],
        "certificate_policies": ["2.23.140.1.2.1"],
        "is_ca": false,
        "scts": [
          {
            "version": "v1",
            "log_id": "96:97:64:BF:55:58:97:AD",
            "timestamp": "Apr 07 01:59:56 2025 GMT"
          }
        ],
        "supported_versions": ["TLSv1.2", "TLSv1.3"],
        "ciphers_by_version": {
          "TLSv1.2": {
            "cipher": "ECDHE-RSA-AES128-GCM-SHA256",
            "bits": 128
          },
          "TLSv1.3": {
            "cipher": "TLS_AES_256_GCM_SHA384",
            "bits": 256
          }
        },
        "weak_protocols": []
      },
      "confidence": 0.95,
      "risk_flags": ["strong_tls", "modern_tls"]
    }
  ]
}
```

### SSH Server with Weak Configuration

```json
{
  "ip": "203.0.113.42",
  "hostnames": ["vps.example.com"],
  "country": "United States",
  "city": "New York",
  "organization": "DigitalOcean LLC",
  "isp": "DigitalOcean",
  "asn": "AS14061 DigitalOcean, LLC",
  "cloud_provider": "DigitalOcean",
  "cloud_region": null,
  "cloud_service": null,
  "hosting_type": "hosting",
  "open_ports": [22, 80, 443],
  "ports": [
    {
      "port": 22,
      "protocol": "tcp",
      "service": "ssh",
      "banner": "SSH-2.0-OpenSSH_7.4",
      "state": "open",
      "protocol_verified": true,
      "cpe": "cpe:/a:openbsd:openssh:7.4",
      "product": "openssh",
      "version": "7.4",
      "vendor": "openbsd",
      "ssh_fingerprint": {
        "host_key_type": "ssh-rsa",
        "host_key": "AAAAB3NzaC1yc2EAAAABIwAAAQEA...",
        "fingerprint": "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99",
        "kex_algorithms": [
          "diffie-hellman-group1-sha1",
          "diffie-hellman-group14-sha1",
          "ecdh-sha2-nistp256"
        ],
        "server_host_key_algorithms": ["ssh-rsa", "ssh-dss"],
        "encryption_algorithms": ["aes128-ctr", "aes256-ctr", "3des-cbc"],
        "mac_algorithms": ["hmac-sha1", "hmac-sha2-256"],
        "compression_algorithms": ["none", "zlib@openssh.com"]
      },
      "confidence": 0.9,
      "risk_flags": ["exposed_admin_or_db_port"],
      "vulnerabilities": [
        {
          "cve": "CVE-2018-15473",
          "severity": "Medium",
          "description": "OpenSSH 7.4 username enumeration vulnerability"
        }
      ]
    }
  ]
}
```

### IP Camera Detection

```json
{
  "ip": "198.51.100.88",
  "hostnames": [],
  "country": "China",
  "city": "Shenzhen",
  "is_camera": true,
  "cameras": [
    {
      "is_camera": true,
      "brand": "Hikvision",
      "model_hint": null,
      "detection_method": "path_probe",
      "camera_path": "/ISAPI/System/deviceInfo",
      "path_status": 401,
      "port": 80,
      "service": "http"
    }
  ],
  "open_ports": [80, 554],
  "ports": [
    {
      "port": 80,
      "protocol": "tcp",
      "service": "http",
      "banner": "HTTP/1.1 401 Unauthorized\nServer: Hikvision-Webs\nWWW-Authenticate: Digest realm=\"Camera\"...",
      "state": "open",
      "protocol_verified": true,
      "camera": {
        "is_camera": true,
        "brand": "Hikvision",
        "model_hint": null,
        "detection_method": "http_headers",
        "camera_path": "/ISAPI/System/deviceInfo",
        "path_status": 401
      },
      "confidence": 0.85,
      "risk_flags": ["exposed_camera", "plaintext_http"]
    },
    {
      "port": 554,
      "protocol": "tcp",
      "service": "rtsp",
      "banner": "RTSP/1.0 401 Unauthorized\nServer: Hikvision IP Camera",
      "state": "open",
      "protocol_verified": true,
      "camera": {
        "is_camera": true,
        "brand": "Hikvision",
        "model_hint": "RTSP Stream",
        "detection_method": "banner"
      },
      "confidence": 0.9,
      "risk_flags": ["exposed_camera_stream"]
    }
  ]
}
```

### Database Server with Misconfiguration

```json
{
  "ip": "192.0.2.100",
  "hostnames": ["db.internal.example.com"],
  "open_ports": [3306, 6379],
  "misconfigurations": ["exposed_mysql", "redis_no_auth"],
  "ports": [
    {
      "port": 3306,
      "protocol": "tcp",
      "service": "mysql",
      "banner": null,
      "state": "open",
      "protocol_verified": true,
      "protocol_info": {
        "version": "8.0.32-0ubuntu0.22.04.2",
        "protocol": 10
      },
      "cpe": "cpe:/a:oracle:mysql:8.0.32",
      "product": "mysql",
      "version": "8.0.32",
      "vendor": "oracle",
      "misconfigurations": ["exposed_mysql"],
      "confidence": 0.8,
      "risk_flags": ["exposed_admin_or_db_port"]
    },
    {
      "port": 6379,
      "protocol": "tcp",
      "service": "redis",
      "state": "open",
      "protocol_verified": true,
      "protocol_info": {
        "redis_version": "7.0.5",
        "os": "Linux 5.15.0-91-generic x86_64",
        "tcp_port": "6379"
      },
      "misconfigurations": ["redis_no_auth"],
      "confidence": 0.75,
      "risk_flags": ["exposed_admin_or_db_port"]
    }
  ]
}
```

## Scan Process

The scanner executes the following steps with progress updates:

1. **5%** - `queued` - Scan queued
2. **10%** - `resolving_ip` - Reverse DNS lookup
3. **30%** - `analyzing_services` - Geolocation and cloud provider detection
4. **40%** - `scanning_ports` - Parallel port scanning (70 ports)
5. **80%** - `filtering_results` - Filter open ports with evidence
6. **90%** - `aggregating_results` - Aggregate vulnerabilities and risks
7. **100%** - `done` - Scan complete

## Port Scanning Details

The scanner probes 70 commonly used ports:

**Standard Services**: 21 (FTP), 22 (SSH), 23 (Telnet), 25 (SMTP), 53 (DNS), 80 (HTTP), 110 (POP3), 143 (IMAP), 443 (HTTPS), 445 (SMB), 465 (SMTPS), 587 (SMTP), 993 (IMAPS), 995 (POP3S)

**Databases**: 3306 (MySQL), 5432 (PostgreSQL), 6379 (Redis), 27017 (MongoDB), 1433 (MS SQL), 1521 (Oracle)

**Admin/Remote Access**: 3389 (RDP), 5900 (VNC)

**Camera/Streaming**: 554 (RTSP), 8554 (RTSP Alt), 34567 (Dahua), 37777 (Dahua), 5400-5800 (webcamXP), 6500, 6565, 8585, 8800, 9090, 9550

**Web Alternatives**: 81-88, 8000, 8008, 8080, 8081, 8100, 8200, 8443, 8888, 9000

**Other Services**: 389 (LDAP), 2049 (NFS), 2375-2376 (Docker), 7001, 9200 (Elasticsearch), 9300, 11211 (Memcached)

## Detection Methods

### Service Identification
1. **Port-based** - Initial service guess based on port number
2. **Banner-based** - Parse service banners for software identification
3. **Protocol handshake** - Verify service via protocol-specific probes
4. **Behavioral analysis** - Send test requests and analyze responses

### TLS Certificate Analysis
- Complete X.509 certificate parsing
- Subject Alternative Name (SAN) extraction for hostname discovery
- Certificate Transparency (CT) log verification
- TLS version and cipher suite enumeration
- Weak protocol and cipher detection

### SSH Fingerprinting
- Host key extraction and fingerprinting
- Algorithm negotiation analysis (KEX, MAC, ciphers, compression)
- Version string parsing

### Camera Detection (4 methods)
1. **Banner signatures** - 24 known camera software patterns
2. **HTTP headers** - Server, WWW-Authenticate, X-Powered-By analysis
3. **Page title** - HTML title tag pattern matching
4. **Path probing** - 14 known camera endpoint paths

### Cloud Provider Detection
- ISP/Organization keyword matching
- Reverse DNS pattern analysis
- IP range database lookup (AWS, GCP, Azure, etc.)
- Region extraction from DNS records

## Security Analysis

### Risk Assessment
Each port receives a confidence score (0.0-1.0) and risk flags based on:
- Protocol verification success
- TLS configuration strength
- Known CVE matches
- Security misconfigurations
- Service exposure (admin ports, databases)

### Vulnerability Matching
- CPE (Common Platform Enumeration) extraction from banners
- CVE database lookup for known vulnerabilities
- CVSS severity scoring

### Misconfiguration Detection
- Anonymous FTP access
- Unauthenticated Redis
- Exposed databases (MySQL, PostgreSQL, MongoDB)
- Exposed Docker API
- Elasticsearch without authentication

## Response Filtering

Only open ports with meaningful data are returned. A port must have at least one of:
- Service banner
- TLS certificate
- Protocol verification
- Camera detection
- Vulnerabilities
- Misconfigurations  
- SSH fingerprint

This reduces noise and focuses results on actionable intelligence.

## Notes

- The scanner respects standard rate limiting and timeout values
- All TLS connections use `verify_mode=CERT_NONE` to accept self-signed certificates
- SSH fingerprinting uses paramiko with critical logging suppressed
- HTTP requests follow redirects for content analysis
- Camera path probing stops at first successful detection
- Geolocation data is provided by ip-api.com (rate limits may apply)

## Error Handling

If the scan fails, the response will contain:
```json
{
  "status": "error",
  "progress": 100,
  "step": "error",
  "result": {
    "error": "Connection timeout / Invalid IP / Scanner exception message"
  }
}
```

## Status Polling

For long-running scans, poll the scan status endpoint:

```
GET /api/scan/status?ip=52.211.48.174
```

Response:
```json
{
  "status": "pending",
  "progress": 60,
  "step": "scanning_ports"
}
```

Status values: `idle`, `pending`, `done`, `error`
