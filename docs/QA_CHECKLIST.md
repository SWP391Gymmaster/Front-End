# FE1 UI and auth checklist

The Playwright browser script intercepts backend calls. Its responses are fixtures, so it checks UI and request contracts but does not prove Gmail delivery. No live accounts or emails are created by the script.

| Check | Evidence / status |
|---|---|
| Public home describes Gym/Yoga/Boxing; anonymous `/classes` prompts login | Current public UI |
| Registration validates fields and opens the email-link instruction modal | `scripts/public-ui.mjs` |
| Resend verification request works; valid and expired link states render without creating an FE session | `scripts/public-ui.mjs` |
| Login API errors appear on the form | `scripts/public-ui.mjs` |
| Mobile registration layout has no horizontal overflow | `scripts/public-ui.mjs` |
| Gmail delivery, real expiry, server verification and login blocking | Requires live BE + Gmail App Password; not exercised by browser fixtures |

Run the UI contract script against the Vite app using `node scripts/public-ui.mjs`. It mocks `POST /auth/register`, `/auth/resend-verification`, and `/auth/verify-email`; it does not send real mail. `scripts/public-unavailable-ui.mjs` checks missing-token handling and the anonymous class prompt.

Registration returns `verificationRequired` and `verificationEmailStatus`. The user opens the verification URL sent by BE, which contains a one-time token; FE posts `{token}` to `/auth/verify-email`. Resending posts `{email}` to `/auth/resend-verification`.

To demonstrate real mail, configure the current BE SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM`, and `FRONTEND_BASE_URL`) in the backend environment. For Gmail, `SMTP_PASSWORD` must be a Google App Password. Then restart BE and register with an inbox you can access. Check Spam if the message is not in the inbox.
