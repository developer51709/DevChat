# Database Recovery

If the database is deleted or corrupted, follow these steps:

1. Ensure `DATABASE_URL` is set in your Secrets.
2. Run the recovery script:
   ```bash
   ./scripts/db-recovery.sh
   ```
3. This will synchronize the schema with the database.

# Password Recovery
Currently, password recovery is not implemented via email. Please contact an administrator to reset your password manually in the database.
