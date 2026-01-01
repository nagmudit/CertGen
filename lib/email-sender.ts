import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { GOOGLE_CONFIG, OUTLOOK_CONFIG } from './auth-config';

export async function sendEmail(
  provider: 'google' | 'outlook',
  tokens: any,
  to: string,
  subject: string,
  body: string,
  attachment: Uint8Array
) {
  if (provider === 'google') {
    return sendGmail(tokens, to, subject, body, attachment);
  } else if (provider === 'outlook') {
    return sendOutlook(tokens, to, subject, body, attachment);
  }
}

async function sendGmail(tokens: any, to: string, subject: string, body: string, attachment: Uint8Array) {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CONFIG.clientId,
    GOOGLE_CONFIG.clientSecret,
    GOOGLE_CONFIG.redirectUri
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  // Refresh if needed (handled by library automatically if refresh_token is present)
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const encodedAttachment = Buffer.from(attachment).toString('base64');
  
  const messageParts = [
    `To: ${to}`,
    'Content-Type: multipart/mixed; boundary="foo_bar_baz"',
    `Subject: ${subject}`,
    '',
    '--foo_bar_baz',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
    '',
    '--foo_bar_baz',
    'Content-Type: application/pdf; name="certificate.pdf"',
    'Content-Disposition: attachment; filename="certificate.pdf"',
    'Content-Transfer-Encoding: base64',
    '',
    encodedAttachment,
    '',
    '--foo_bar_baz--',
  ];

  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
}

async function sendOutlook(tokens: any, to: string, subject: string, body: string, attachment: Uint8Array) {
  // Check expiry and refresh if needed manually for Outlook/Graph
  let accessToken = tokens.access_token;
  
  if (Date.now() > tokens.expiry_date) {
    // Refresh token logic
    const response = await fetch(OUTLOOK_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: OUTLOOK_CONFIG.clientId,
        client_secret: OUTLOOK_CONFIG.clientSecret,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    
    const newTokens = await response.json();
    if (newTokens.error) throw new Error(newTokens.error_description);
    accessToken = newTokens.access_token;
    // Note: In a real app, we should update the stored tokens, but here we just use it for this call
  }

  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  const encodedAttachment = Buffer.from(attachment).toString('base64');

  const mail = {
    subject: subject,
    toRecipients: [
      {
        emailAddress: {
          address: to,
        },
      },
    ],
    body: {
      content: body,
      contentType: 'text',
    },
    attachments: [
      {
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: 'certificate.pdf',
        contentType: 'application/pdf',
        contentBytes: encodedAttachment,
      },
    ],
  };

  await client.api('/me/sendMail').post(mail);
}
