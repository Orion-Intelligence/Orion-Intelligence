export interface IpPortTls {
  version?:              string;
  cipher?:               string;
  bits?:                 number;
  cert_cn?:              string;
  cert_expires?:         string;
  subject?:              Record<string, any>;
  issuer?:               Record<string, any>;
  san?:                  any[];
  fingerprint_sha256?:   string;
  is_self_signed?:       boolean;
  not_before?:           string;
  not_after?:            string;
  serial_number?:        string;
  signature_algorithm?:  string;
  public_key_algorithm?: string;
  public_key_size?:      number;
  key_usage?:            string[];
  extended_key_usage?:   string[];
  weak_protocols?:       string[];
  supported_versions?:   string[];
  risk_flags?:           string[];
  [key: string]: any;
}

export interface IpPortData {
  port:                number;
  protocol?:           string;
  proto?:              string;
  service?:            string;
  banner?:             string;
  http?:               { title?: string; server?: string; [k: string]: any } | null;
  tls?:                IpPortTls | null;
  state?:              string;
  risk_flags?:         string[];
  misconfigurations?:  string[];
  [key: string]: any;
}

export interface CameraInfo {
  ip:               string;
  latitude?:        number;
  longitude?:       number;
  port?:            number;
  brand?:           string;
  model?:           string;
  distance_km?:     number;
  country?:         string;
  city?:            string;
  url?:             string;
  stream_url?:      string;
  camera_path?:     string;
  camera_paths?:    string[];
  cameras?:         Array<{
    port?: number;
    service?: string;
    brand?: string;
    model_hint?: string | null;
    camera_path?: string;
    path_status?: number;
    is_camera?: boolean;
    [key: string]: any;
  }>;
  ports?:           Array<number | IpPortData>;
  vulnerabilities?: string[];
}

export interface DnsResult {
  domain: string;
  ips:    string[];
}

export interface IpDetail {
  ip:                 string;
  hostnames?:         string[];
  country?:           string | null;
  city?:              string | null;
  organization?:      string | null;
  isp?:               string | null;
  asn?:               string | null;
  cloud_provider?:    string | null;
  cloud_region?:      string | null;
  cloud_service?:     string | null;
  hosting_type?:      string | null;
  web_technologies?:  string[];
  vulnerabilities?:   string[];
  misconfigurations?: string[];
  security?:          string[] | Record<string, boolean>;
  cdn?:               string | null;
  waf?:               string | null;
  paas?:              string | null;
  amazon_s3?:         boolean;
  load_balancer?:     string | null;
  hsts?:              boolean;
  web_server?:        string | null;
  favicon_hash?:      string | null;
  allowed_methods?:   string[];
  cookies?:           string[];
  title?:             string | null;
  http_headers?:      Record<string, string | null>;
  cache_headers?:     Record<string, string | null>;
  link_headers?:      string[];
  cameras?:           CameraInfo[];
  is_camera?:         boolean;
  ports?:             IpPortData[];
  open_ports?:        number[];
}

export interface IpRowState {
  ip:       string;
  expanded: boolean;
  loading:  boolean;
  detail:   IpDetail | null;
  error:    string | null;
}

export interface GeoQueryInfo {
  latitude:  number;
  longitude: number;
  radius_km: number;
  country:   string;
}

export interface GeoResult {
  status:        string;
  query:         GeoQueryInfo;
  ips_extracted: number;
  ips_scanned:   number;
  cameras_found: number;
  cameras:       CameraInfo[];
}

export interface GeoLiveStats {
  ips_extracted: number;
  ips_scanned:   number;
  cameras_found: number;
}
