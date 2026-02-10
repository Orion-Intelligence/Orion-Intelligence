# Dynamic: dynamic_ioc_extract

## Description

Perform a dynamic extraction of Indicators of Compromise (IOCs) from uploaded files or images.
The API analyzes textual and visual content to identify security-relevant indicators such as CVEs, domains, IPs, URLs, hashes, and detected language metadata.

Supported input formats include:
- Text files: .txt, .pdf
- Images: .png, .jpg, .jpeg

The API automatically extracts readable text (OCR applied for images when required) and scans it for known IOC patterns.

## Response

The API returns a JSON object containing extracted metadata and identified IOCs.

Example response:
```json
{
  "result": {
    "filename": "tmp9qxjcr5k.txt",
    "file_type": "text",
    "extracted_text_length": 1096,
    "iocs": [
      {
        "m_cve": "CVE-2025-59374"
      },
      {
        "m_domain": "asus.com"
      },
      {
        "m_domain": "bleepingcomputer.com"
      },
      {
        "m_language": "en"
      }
    ],
    "status": "success",
    "original_filename": "report_8_threats.txt"
  }
}

```

Field semantics for each element under **result**:
- **filename** — temporary filename assigned during processing
- **original_filename** — original uploaded file name
- **file_type** — detected file type (text, pdf, image)
- **extracted_text_length** — total number of characters extracted from the content
- **iocs** — array of extracted indicators
- **status** — processing status (success, failed)


