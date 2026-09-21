# Social: phone_recon

## Description

Initiates a reconnaissance scan specifically targeting phone numbers across social media platforms, public directories, and other open-source intelligence sources. This endpoint corresponds to `POST /api/social/phone/recon`.

Supported request fields:

- **query** — The phone number to search for (include country code for best results).

Example request payload:

```json
{
  "query": "+1234567890"
}
```

## Response

The API returns a collection of identified accounts and online presence details associated with the phone number.

Example response:
```json
{
  "result": [
    {
      "metadata": {
        "platform": "whatsapp",
        "status": "active"
      },
      "data": {
        "title": "John Doe - WhatsApp Business",
        "snippet": "Available"
      }
    }
  ]
}
```
