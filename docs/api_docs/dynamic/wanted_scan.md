# Dynamic: wanted_scanner

## Description

Performs a scan for the Wanted people around the Globe in wanted databases, sanctions lists, watchlists, or law-enforcement records.
This scan helps identify whether a person is flagged internationally and may return metadata such as aliases, issuing authority, offense category, risk indicators, and reference sources.

The request is an HTTP POST and expects a JSON body with a text object containing identifying information about the person to analyze.


# Request Body

Example request:

```json
{
  "text": {
    "query": "John Doe"
  }
}
```

## Request Fields

- **text** — query container
  - **name** — any name to scan  
    Examples:
    - `John Doe`


# Response

Dynamic wanted-person intelligence results containing watchlist matches, issuing authorities, offense classifications, and verification indicators.

The response is a JSON object containing a result object describing the analyzed individual.

Example response:

```json

{
  "result": {
    "input_name": "John Doe",
    "match_found": true,
    "person_details": {
      "name": "Johnathan Andrew Doe",
      "aliases": [
        "Jon Doe",
        "J.A. Doe"
      ],
      "dob": "1984-03-12",
      "nationality": "Unknown"
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


Field semantics for each element under **result**:
- **input_name** — the original name provided in the search request
- **match_found** — boolean flag indicating whether a matching record was identified
- **person_details** — object containing detailed identity information of the matched individual
- **name** — full legal name of the identified person
- **aliases** — list of known alternative names or aliases
- **dob** — date of birth of the individual (YYYY-MM-DD format)
- **nationality** — reported or known nationality of the individual
- **issuing_authority** — object containing information about the authority that issued the notice or record
- **agency** — name of the issuing organization
- **country** — country where the issuing authority is based
- **notice_type** — type of notice issued (e.g., red_notice, blue_notice, sanction_list)
- **offense_information** — object describing the alleged offense details
- **primary_offense** — main offense associated with the individual
- **description** — summary of the alleged criminal activity
- **date_issued** — date when the notice or record was officially issued (YYYY-MM-DD format)
- **sources** — list of data sources or databases from which the information was obtained
- **status** — processing status of the request (success, failed)
- **query_type** — type of query performed (e.g., person_identity, organization_check, sanctions_lookup)
