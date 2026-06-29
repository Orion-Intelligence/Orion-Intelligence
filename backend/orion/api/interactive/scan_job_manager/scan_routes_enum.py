from typing import Dict


SCAN_ROUTES: Dict[str, Dict[str, str]] = {
    "netintel/resolve_ip": {
        "path": "netintel/resolve_ip",
        "target_key": "domain",
    },
    "netintel/ipscanner": {
        "path": "netintel/netintel_scanner",
        "target_key": "ip",
    },
    "netintel/url_vulnerability_scan": {
        "path": "netintel/url_vulnerability_scan",
        "target_key": "domain",
    },
    "netintel/iot_detect": {
        "path": "netintel/iot_detect",
        "target_key": "coordinates",
    },
    "netintel/camera_detect_ranges": {
        "path": "netintel/camera_detect_ranges",
        "target_key": "ip_ranges",
    },
    "urlscan/domain": {
        "path": "urlscan/domain",
        "target_key": "domain",
    },
    "urlscan/subdomains": {
        "path": "urlscan/domain",
        "target_key": "domain",
    },
    "urlscan/dns": {
        "path": "urlscan/ip",
        "target_key": "ip",
    },
    "urlscan/wayback": {
        "path": "urlscan/domain",
        "target_key": "domain",
    },
    "dynamic/user": {
        "path": "runtime/parse/user",
        "target_key": "text",
    },
    "dynamic/social": {
        "path": "runtime/parse/social",
        "target_key": "text",
    },
    "dynamic/wanted": {
        "path": "runtime/parse/wanted",
        "target_key": "text",
    },
    "dynamic/cracked": {
        "path": "runtime/parse/cracked",
        "target_key": "text",
    },
    "dynamic/software": {
        "path": "runtime/parse/software",
        "target_key": "text",
    },
    "dynamic/national-identity": {
        "path": "runtime/parse/pak_database",
        "target_key": "text",
    },
    "crypto/scan": {
        "path": "runtime/parse/crypto",
        "target_key": "text",
    },
}
