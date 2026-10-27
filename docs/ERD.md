# Database design (ERD)

```mermaid
erDiagram
    USER ||--o{ UTILITY : owns
    USER ||--o{ READING : records
    USER ||--o{ BILL : receives
    UTILITY ||--o{ READING : has
    UTILITY ||--o{ BILL : "billed as"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string role "user or admin"
        date createdAt
    }
    UTILITY {
        ObjectId _id PK
        ObjectId user FK
        string type "electricity, water or gas"
        string provider
        string accountNumber
        string meterNumber
    }
    READING {
        ObjectId _id PK
        ObjectId user FK
        ObjectId utility FK
        date date
        number reading
        number usage "reading minus previous reading"
    }
    BILL {
        ObjectId _id PK
        ObjectId user FK
        ObjectId utility FK
        string type
        string period "YYYY-MM"
        number usage
        number amount
        string status "paid or pending"
    }
    TARIFF {
        ObjectId _id PK
        string utilityType "electricity, water or gas"
        string unit
        number ratePerUnit
        number fixedCharge
        date effectiveFrom
    }
```

## Notes

- A user owns many utilities. Each utility has many readings and many bills.
- `BILL` has a unique index on (`utility`, `period`), so a utility can have only one bill per month.
- `TARIFF` is not linked by a foreign key. A bill uses the newest tariff whose `utilityType` matches and whose `effectiveFrom` is on or before the billing month.
- Deleting a utility also deletes its readings and bills. Deleting a user deletes all of their data.