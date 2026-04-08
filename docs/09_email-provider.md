# Email Provider Setup

## Current State

`sendResetPassword` in `lib/auth/auth.ts` logs the reset URL to the server console instead of sending an email. This is intentional for development — the full reset flow works, you just copy the link manually.

### Dev mailbox endpoint

For testers who don't have access to the server console, a dev-only endpoint is available:

```
GET http://localhost:3000/api/dev/reset-links
```

Returns the last 20 reset links as JSON:

```json
{
  "links": [
    {
      "email": "user@example.com",
      "url": "http://localhost:3000/api/auth/reset-password/TOKEN?callbackURL=%2Freset-password",
      "at": "2026-04-06T12:00:00.000Z"
    }
  ]
}
```

This endpoint returns **404 in production** (`NODE_ENV !== "development"`). It is safe to leave in the codebase — remove it when you wire up a real provider if you prefer.

## Wiring a Real Provider

### 1. Install a mailer

Pick one:

```bash
npm install nodemailer          # SMTP (generic)
npm install resend              # Resend API (recommended)
```

### 2. Add env variables

For **Resend**:

```env
RESEND_API_KEY=re_...
RESET_PASSWORD_FROM_EMAIL=noreply@yourdomain.com
```

For **Nodemailer / SMTP**:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
RESET_PASSWORD_FROM_EMAIL=noreply@yourdomain.com
```

### 3. Replace the stub in `lib/auth/auth.ts`

Find this block:

```ts
sendResetPassword: async ({ user, url }) => {
  console.log(
    `[Password Reset] Reset link for ${user.email}:\n${url}\n(Configure an email provider to send this automatically.)`,
  );
},
```

Replace with your mailer call. Example using **Resend**:

```ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

sendResetPassword: async ({ user, url }) => {
  await resend.emails.send({
    from: process.env.RESET_PASSWORD_FROM_EMAIL!,
    to: user.email,
    subject: "Reset your Princeps password",
    html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });
},
```

### 4. No other changes needed

- The pages (`/forgot-password`, `/reset-password`) are already live.
- The token logic, validation, and redirect are all handled by Better Auth.
- `proxy.ts` already marks both routes as public.
