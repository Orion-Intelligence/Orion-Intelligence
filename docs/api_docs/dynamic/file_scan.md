# Dynamic: dynamic_file_scan

## Description

Perform a dynamic forensic scan of uploaded files including documents, images, and APK packages.

The API extracts embedded text, metadata, and structural information, and performs security analysis to identify Indicators of Compromise (IOCs) such as:

- CVEs  
- IP addresses  
- Domains  
- URLs  
- File hashes (MD5, SHA1, SHA256)  
- Suspicious strings or embedded artifacts  

Supported input formats include:
- Documents: `.txt`, `.pdf`, `.doc`, `.docx`
- Images: `.png`, `.jpg`, `.jpeg`
- Android packages: `.apk`

For images, OCR is applied to extract visible and hidden text.  
For APKs, the API analyzes manifest files, permissions, embedded resources, and code signatures.

---

## Response

The API returns a structured JSON object containing extracted metadata, file analysis details, and detected IOCs.

### Example response for apk file

```json
{
  "result": {
    "filename": "tmp8xqk91.apk",
    "original_filename": "sample_app.apk",
    "file_type": "apk",
    "file_size_bytes": 15423890,
    "extracted_text_length": 4821,
    "mime_type": "application/vnd.android.package-archive",

    "analysis": {
      "is_signed": true,
      "signing_algorithm": "SHA256withRSA",
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      "package_name": "com.example.malware",
      "version_code": "12",
      "version_name": "1.2.0",
      "suspicious_flags": [
        "uses_dynamic_code_loading",
        "accesses_sms_permissions"
      ]
    },
    "status": "success"
  }
}
```

### Example response for other file types

```json
{
  "result": {
    "file_type": "pdf",
    "filename": "tmp_doc_10.pdf",
    "original_filename": "report.pdf",
    "status": "success",

    "metadata": {
      "file_size_bytes": 221344,
      "mime_type": "application/pdf",
      "extracted_text_length": 5421,
      "created_at": "2026-04-15T08:00:00Z",
      "author": "unknown"
    },

    "extracted_content": {
      "text": "The system was compromised using CVE-2022-12345...",
      "language": "en"
    },

    "iocs": {
      "ips": ["10.10.10.10"],
      "domains": ["internal-system.local"],
      "urls": [],
      "cves": ["CVE-2022-12345"],
      "hashes": {
        "sha1": ["2fd4e1c67a2d28fced849ee1bb76e7391b93eb12"]
      }
    }
  }
}
```