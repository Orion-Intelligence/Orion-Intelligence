# Dynamic: dynamic_apk_scan

## Description

Perform a dynamic static-analysis scan of an uploaded Android APK file to identify application metadata, security posture, permission usage, cryptographic weaknesses, network behavior, and potential tampering or cracking indicators.

The API inspects the APK without executing it and extracts security-relevant signals useful for malware analysis, threat intelligence, and mobile application risk assessment.

Supported File Types
- .apk

## Response

The API returns a structured security analysis report describing application metadata, permissions, cryptographic risks, network behavior, and tampering indicators.

Example response:
```json
{
  "result": {
    "package": "com.atomczak.notepat",
    "version": "1.43.2",
    "sdk": {
      "min": 23,
      "target": 35
    },
    "signed": true,
    "debuggable": false,
    "certificate": {
      "issuer": "CN=Unknown",
      "sha256": "93:BD:BF:69:DD:A6:73:1E:87:27:DE:50:3C:8F:00:D8:91..."
    },
    "permissions": {
      "total": 11,
      "dangerous": 0,
      "dangerous_list": []
    },
    "network": {
      "urls_found": 10,
      "cleartext": true,
      "sample_urls": [
        "http://bit.ly/notepad-personalized-ads-opt-out",
        "https://bit.ly/notepad-personalized-ads-opt-out",
        "https://drive.google.com",
        "https://firebase.google.com/support/privacy",
        "https://play.google.com/store/apps/details?id=com.google.android.apps.docs"
      ]
    },
    "crypto": {
      "weak_algorithms": [
        "MD5",
        "DES",
        "SHA1",
        "RC4"
      ]
    },
    "tampering": {
      "suspected": true,
      "reasons": [
        "Unofficial certificate",
        "Missing billing classes (possible cracked app)"
      ]
    },
    "status": "success",
    "original_filename": "Notepad - simple notes_1.43.2_APKPure.apk"
  }
}


```

Field semantics for each element under **result**:
- **package** — Android package identifier of the application
- **version** — Application version extracted from APK
- **sdk.min** — Minimum Android SDK version required by the application
- **sdk.target** — Target Android SDK version used during development
- **signed** — Indicates whether the APK is digitally signed
- **debuggable** — Indicates whether debugging mode is enabled in the application
- **certificate.issuer** — Certificate issuer details
- **certificate.sha256** — SHA256 fingerprint of the signing certificate
- **permissions.total** — Total number of permissions requested by the application
- **permissions.dangerous** — Number of permissions classified as dangerous
- **permissions.dangerous_list** — List of dangerous permissions if detected
- **etwork.urls_found** — Total number of URLs discovered inside the APK
- **network.cleartext** — Indicates whether unencrypted HTTP communication is present
- **network.sample_urls** — Sample list of extracted URLs from application resources or code
- **crypto.weak_algorithms** — List of weak or deprecated cryptographic algorithms detected within the application
- **tampering.suspected** — Indicates whether the APK shows signs of modification or repackaging
- **tampering.reasons** — Explanation describing suspected tampering indicators
- **status** — Processing result (success, failed)
- **original_filename** — Original uploaded APK file name

