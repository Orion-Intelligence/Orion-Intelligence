# Wanted Scanner

## Desctiption

Performs a scan for the Wanted people around the Globe in wanted databases, sanctions lists, watchlists, or law-enforcement records.

This scan helps identify whether a person is flagged internationally and may return metadata such as aliases, issuing authority, offense category, risk indicators, and reference sources.

The request is an HTTP POST and expects a JSON body with a text object containing identifying information about the person to analyze.


# Request Body

Example request:

```json
{
  
  {text: {query: "Jhon Doe"}}
  
}

```


# Response

Dynamic wanted-person intelligence results containing watchlist matches, issuing authorities, offense classifications, and verification indicators.

The response is a JSON object containing a result object describing the analyzed individual.

Example response:

```json

{
  "result": {
    "input_name": "John Doe",
    "match_found": true,
    "match_confidence": 0.92,
    "person_details": {
      "name": "Johnathan Andrew Doe",
      "aliases": [
        "Jon Doe",
        "J.A. Doe"
      ],
      "dob": "1984-03-12",
      "nationality": "Unknown"
    },
    "wanted_status": {
      "is_wanted": true,
      "category": "financial_crime",
      "risk_level": "high"
    },
    "issuing_authority": {
      "agency": "International Criminal Police Organization",
      "country": "France",
      "notice_type": "red_notice"
    },
    "offense_information": {
      "primary_offense": "Money Laundering",
      "description": "Suspected involvement in cross-border financial fraud and laundering activities.",
      "date_issued": "2022-11-05"
    },
    "sources": [
      "Interpol Notices Database",
      "Global Sanctions Watchlist",
      "Financial Crime Intelligence Unit"
    ],
    "status": "success",
    "query_type": "person_identity"
  }
}

```
