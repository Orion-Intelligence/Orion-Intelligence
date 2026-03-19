export interface ResolveIpResponse {
  status?:   string;
  progress?: number;
  result?: {
    status?: string;
    domain:  string;
    ips:     string[];
  };

  domain?: string;
  ips?:    string[];
}

export interface NetworkIntelScanResponse {
  status?:   string;
  progress?: number;
  result?: {
    status?: string;
    ip:      string;
    [key: string]: any;
  };
  ip?: string;
  [key: string]: any;
}

export interface GeoCameraResponse {
  status?:        string;
  progress?:      number;
  step?:          string;
  ips_extracted?: number;
  ips_scanned?:   number;
  cameras_found?: number;
  result?: {
    status?:        string;
    cameras?:       any[];
    ips_extracted?: number;
    ips_scanned?:   number;
    cameras_found?: number;
    query?:         any;
  };
  cameras?: any[];
  query?:   any;
}
