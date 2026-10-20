# FE1 UI and auth checklist

The Playwright browser script intercepts backend calls. Its OTP responses are fixtures, so it checks the dialog and UI states but does not prove Gmail delivery. No live accounts or emails are created by that script.

| Check | Evidence / status |
|---|---|
| Public home describes Gym/Yoga/Boxing; anonymous `/classes` prompts login | Current public UI |
| Registration validates fields and opens OTP dialog after mocked `{status:"sent"}` | `scripts/public-ui.mjs` |
| Invalid OTP shows an error; verified OTP completes registration without creating a FE session | `scripts/public-ui.mjs` |
| Login API errors appear on the form | `scripts/public-ui.mjs` |
| Mobile registration layout has no horizontal overflow | `scripts/public-ui.mjs` |
| Gmail delivery, real expiry, server verification and login blocking | Requires live BE + Gmail App Password; not exercised by browser fixtures |

Run the UI contract script against the Vite app using `node scripts/public-ui.mjs`. The script mocks the OTP API; no `VITE_VERIFY_EMAIL_PATH` or `VITE_RESEND_EMAIL_PATH` variables are needed. `scripts/public-unavailable-ui.mjs` checks the informational `/verify` route and anonymous class prompt, not a missing OTP backend.

To demonstrate real mail, follow [Gmail OTP setup](../../Back-End/docs/GMAIL_OTP_SETUP.md), start the backend with `GMAIL_USERNAME` and `GMAIL_APP_PASSWORD`, then register using a Gmail inbox you can access. Check Spam if the message is not in the inbox.
