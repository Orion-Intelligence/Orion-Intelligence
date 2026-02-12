# Dynamic: dynamic_crypto_scan

## Description

Perform a dynamic cryptocurrency scan to retrieve intelligence related to Bitcoin wallet addresses or transaction hashes. This helps identify wallet activity, transaction history, balance information, and potential risk indicators.

The request is an HTTP POST and expects a JSON body with a **text** object containing either a cryptocurrency wallet address or a transaction hash to analyze.

```json
{
  "text": {
    "wallet": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  }
}
```

```json
{
  "text": {
    "hash": "685b826d9726bcb2e287abb47a24f575aefe6fec7ccb2fa6304ebc11ea2b0842"
  }
}
```

The **wallet** field should contain a valid cryptocurrency wallet address.
The **hash** field should contain a valid cryptocurrency transaction hash.
Only one field (wallet or hash) should be provided per request.

## Response

Dynamic cryptocurrency intelligence results containing wallet statistics, transaction details, network activity, and risk assessment information.

The response is a JSON object containing a **result** object describing the analyzed wallet or transaction.

Example response:
```json
{
  "result": {
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "network": "bitcoin",
    "balance": {
      "confirmed": 362622341,
      "unconfirmed": 0
    },
    "transaction_count": {
      "total": 984,
      "received": 1024,
      "sent": 434
    },
    "total_received": 1649628180,
    "total_sent": 1287005839,
    "statistics": {
      "first_seen": 1768091818,
      "last_seen": 1770541860,
      "avg_transaction_value": 0.0161096501953125,
      "is_active": false
    },
    "recent_transactions": [...],
    "risk_assessment": {
      "risk_level": "medium",
      "risk_factors": [
        "High balance wallet (>1 BTC)"
      ]
    },
    "status": "success",
    "query_type": "wallet_address",
    "detected_network": "bitcoin"
  }
}
```

Field semantics for each element under **result**:
- **address** — Cryptocurrency wallet address that was analyzed
- **network** — Blockchain network associated with the wallet or transaction (e.g., bitcoin)
- **balance** - 
    - **confirmed** - Total confirmed wallet balance in smallest currency units (e.g., satoshis)
    - **unconfirmed** - Pending or unconfirmed balance
- **transaction_count** - 
    - **total** - Total number of transactions linked to the wallet
    - **received** -Total number of transactions where funds were received
    - **sent** - Total number of transactions where funds were sent
- **total_received** — Total amount ever received by the wallet
- **total_sent** — Total amount ever sent from the wallet
- **statistics**
    - **first_seen** - Timestamp indicating the earliest known activity for the wallet or transaction
    - **last_seen** - Timestamp indicating the most recent observed activity
    - **avg_transaction_value** - Average value per transaction
    - **is_active** - Indicates whether the wallet is currently active based on recent transaction behavior
- **recent_transactions** — List of recent transactions associated with the wallet or transaction hash. Each transaction may include:
    - **txid** - Unique transaction identifier
    - **vin** - Transaction input details including previous outputs and originating addresses
    - **vout** - Transaction output details including destination addresses and transferred values
    - **fee** - Transaction fee paid
    - **status** - Confirmation details including block information and timestamps
- **risk_assessment** — 
    - **risk_level** - Evaluated risk category such as low, medium, or high
    - **risk_factors** - List of conditions contributing to the assigned risk level
- **status** — Indicates whether the scan completed successfully
- **query_type** — Specifies whether the scan was performed using a wallet_address or transaction_hash
- **detected_network** — Automatically detected blockchain network for the provided input

