# Certificate Generator & Bulk Sender

A secure, public web platform to design certificates, upload recipient data, and send them via Gmail or Outlook using OAuth.

## Features

- **Certificate Designer**: Drag-and-drop editor with variable support (e.g., `{{name}}`).
- **Bulk Sending**: Upload CSV and send personalized emails.
- **Secure OAuth**: No password sharing. Tokens are encrypted and stored in HTTP-only cookies.
- **Background Processing**: Uses BullMQ and Redis for reliable queue management.
- **Progress Tracking**: Real-time dashboard of sending status.

## Setup

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Environment Variables**:
    Copy `.env.local` and fill in the values:
    - `ENCRYPTION_KEY`: Generate a 32-byte hex string (e.g., `openssl rand -hex 32`).
    - `REDIS_URL`: Your Redis connection string.
    - `GOOGLE_CLIENT_ID` / `SECRET`: From Google Cloud Console (Enable Gmail API).
    - `OUTLOOK_CLIENT_ID` / `SECRET`: From Azure Portal (App Registration with `Mail.Send` scope).

3.  **Run Redis**:
    Ensure you have a Redis instance running.

4.  **Run the Application**:
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

5.  **Run the Worker**:
    The worker processes the email queue in the background. Open a new terminal:
    ```bash
    npx ts-node scripts/worker.ts
    ```

## Usage Flow

1.  **Design**: Use the editor to create your certificate template. Add variables like `{{name}}`.
2.  **Upload**: Drop a CSV file containing columns matching your variables (e.g., `name`, `email`).
3.  **Authenticate**: Click "Continue with Gmail/Outlook" to grant permission.
4.  **Send**: Configure the email subject/body and click Send.
5.  **Monitor**: Watch the progress table as emails are sent.

## Security Notes

- Tokens are encrypted using AES-256-CBC.
- Tokens are stored in `httpOnly` cookies, inaccessible to client-side JS.
- No long-term storage of credentials in a database.
- OAuth scopes are restricted to sending mail only.
