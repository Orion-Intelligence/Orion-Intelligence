# Dynamic: dynamin_national_identity

## Description

Perform a dynamic lookup for Pakistani national identity and law-enforcement–related records using:
- CNIC (Computerized National Identity Card number)
- Phone number
- Family number

This API correlates national identity records, associated phone numbers, addresses, family tree information, and FIR/complaint-related metadata.
Depending on the input type, the API returns different structured datasets:

- **CNIC** - Returns associated phone numbers, addresses, person details, and family tree data.
- **Phone number** - Returns identity details and FIR/complaint records.
- **Family number** - Returns complete family tree information.
- **CNIC (extended mode)** - Can also return FIR/complaint records if available.

The request is an HTTP POST and expects a JSON body matching the `search_dynamic_crack_model` schema:

```json
{
  "text": {
    "pak_query": "03012345678"
  }
}
```

Fields:
- **pak_query** — Can contain:
    - `CNIC number` (e.g., "351234567809")
    - `Phone number` (e.g., "92312345678")
    - `Family number` (e.g., "35123")


## Response

Response Structure:
The API returns a JSON object containing:

```json
{
  "result": {
    "status": "done",
    "result": []
  }
}
```

- **status** — Operation status (done, failed, etc.)
- **result** — Array of records matching the query

For **Phone Number** scans, the structure of `result` is typically:
- **Person name**
- **CNIC number**
- **Registered address**
- **Linked phone numbers**
- **FIR / complaint details**

```json
{
  "result": {
    "status": "done",
    "result": [
      {
        "m_phone_numbers": ["92301234567"],
        "m_location": ["house # 1A Lahore"],
        "m_name": "AHMED",
        "m_id_card_number": ["351234567809"]
      }
    ]
  }
}
```

FIR Fields (when available)
```json
{
  "m_region": "Punjab",
  "m_district": "Lahore",
  "m_police_station": "City Police Station",
  "m_complaint_record": "FIR-2023-4567",
  "m_officer_name": "Inspector Ali Raza",
  "m_complaint_status": "Under Investigation",
  "m_offense": "Fraud"
}
```

For **CNIC** scans, the structure of `result` is typically:
- **Person name**
- **Associated phone numbers**
- **Registered addresses**
- **Identity confirmation**

```json
{
  "result": {
    "status": "done",
    "result": [
      {
        "m_phone_numbers": [
          "923443580518",
          "923443353778"
        ],
        "m_location": [
          "HOUSE NUMBER 10 MOHALA RASOOL NAGR SHAH COLONY ROAD SHEIKHU PURA"
        ],
        "m_name": "SYED MUHAMMAD IBRAHIM",
        "m_id_card_number": [
          "351234567809"
        ]
      }
    ]
  }
}
```

For **Family Tree Response** scans, the structure of `result` is typically:
```json
{
  "m_family_number": "FAM-987654",
  "m_head_name": "SYED AKBAR ALI",
  "m_head_dob": "1965-04-12",
  "m_family_members": [
    {
      "name": "Ahmed",
      "dob": "1995-07-10",
      "relation": "Son",
      "cnic": "351234567809"
    }
  ]
}
```
Fields:
- **m_name** — Full name of the person
- **m_id_card_number** — CNIC number(s) linked to the record
- **m_phone_numbers** — Associated mobile numbers
- **m_location** — Registered residential address
- **m_region** — Province or administrative region
- **m_district** — District of complaint

FIR Fields:
- **m_police_station** — Police station handling case
- **m_complaint_record** — FIR or complaint reference number
- **m_officer_name** — Assigned investigating officer
- **m_complaint_status** — Case status (Closed, Under Investigation, Pending, etc.)
- **m_offense** — Nature of alleged offense

Family Tree Fields:
- **m_family_number** — Unique family identifier
- **m_head_name** — Head of family name
- **m_head_dob** — Date of birth of family head
- **m_family_members** — Array of related family members
