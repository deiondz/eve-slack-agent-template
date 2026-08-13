# Use libSQL for durable stand-up storage

The stand-up ledger must be shared across Slack sessions and survive Vercel function replacement. Use the libSQL client with a local SQLite file in development and Turso in production, preserving SQLite semantics without relying on Vercel's ephemeral filesystem.
