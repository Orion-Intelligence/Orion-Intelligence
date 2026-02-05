export const IOC_EXTRACT_ENDPOINT = 'ioc/extract';
export const APK_SCAN_ENDPOINT = 'apk/scan';

export const MAX_FILE_SIZE_IOC = 1024 * 1024;          // 1 MB
export const MAX_FILE_SIZE_APK = 1024 * 1024 * 30;     // 30 MB

export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/vnd.android.package-archive': ['.apk']
};

export const IOC_LABELS: Record<string, { label: string; description: string }> = {
  m_domain:       { label: 'Domain',              description: 'Domain name detected in the file' },
  m_email:        { label: 'Email Address',       description: 'Email address found in the document' },
  m_phone_number: { label: 'Phone Number',        description: 'Phone number extracted from content' },
  m_country:      { label: 'Country',             description: 'Country name mentioned' },
  m_location:     { label: 'Location',            description: 'Geographic location reference' },
  m_uk_nhs:       { label: 'UK NHS Number',       description: 'UK National Health Service identifier' },
  m_us_driver_license: { label: 'US Driver License', description: 'US driver license identifier' },
  m_username:     { label: 'Username',            description: 'Username or handle detected' },
  m_language:     { label: 'Language',            description: 'Language code identified' },
  m_ip:           { label: 'IP Address',          description: 'IP address found in content' },
  m_url:          { label: 'URL',                 description: 'Web URL extracted' },
  m_hash:         { label: 'Hash',                description: 'File hash or cryptographic hash' },
  m_ssn:          { label: 'SSN',                 description: 'Social Security Number' },
  m_credit_card:  { label: 'Credit Card',         description: 'Credit card number' },
  m_package:      { label: 'Android Package',     description: 'Application package identifier' },
  m_permission:   { label: 'Dangerous Permission', description: 'Dangerous Android permission requested' },
  m_tampering:    { label: 'Tampering Indicator', description: 'Potential tampering or modification detected' }
};
