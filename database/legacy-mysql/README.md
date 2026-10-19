# Legacy MySQL files (reference only)

These are the original MySQL schema and migration. The application no longer
uses MySQL; the PostgreSQL schema lives in `database/postgres/migrations/`.

They are kept so that an existing MySQL database can be recreated for the
one-off data transfer (`npm run db:transfer-mysql`, see the root README).
Do not run them against PostgreSQL.
