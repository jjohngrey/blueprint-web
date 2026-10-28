# BluePrint Tech Week

Install dependencies with `npm install`, then run `npm run dev` and open [localhost:3000](http://localhost:3000).

## Email signups

Signups append to a private Google Sheet. Enable the Google Sheets API in a Google Cloud project, create a service account, and share the spreadsheet with that account as an Editor. Create a tab named `Subscribers` with `email` in A1 and `subscribed_at` in B1.

Set these server environment variables in `.env.local` for local development and in the deployment environment for production:

```dotenv
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The spreadsheet ID is the part of its URL between `/d/` and `/edit`. The email and private key come from the service account's credentials. The key accepts real newlines or escaped `\n` sequences. Keep these values private and do not add a `NEXT_PUBLIC_` prefix.

Each valid submission appends the trimmed, lowercased email and a UTC ISO timestamp to `Subscribers!A:B`. Values are stored as raw text. Repeated addresses create additional rows. The app does not read, deduplicate, send newsletters, or fall back to local files. A signup is confirmed only after Google accepts the append. Append requests have a 10 second timeout and automatic retries disabled.

Without all three variables, the page offers the Instagram updates link and the API returns 503 for signups. Google errors also return 503 with a generic message, leaving the entered address in the form for a retry.

## Deploy and verify

Deploy as a Node.js Next.js application, including on Vercel. Set the three variables for the intended deployment environment and redeploy after changing them. The service account must retain Editor access to the spreadsheet.

Run `npm run lint`, `npm run build`, and `npm test`. After deployment, submit a test address through the form and confirm that a new row appears in the `Subscribers` tab. Submit it again to confirm a second row is appended.
