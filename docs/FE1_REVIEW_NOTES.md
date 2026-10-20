# FE1 request flow — presentation notes

## Actual React implementation

`main.jsx → StoreProvider → App → PublicApp → RegisterForm`.
Register submit validates form, calls `publicService.register → createApiClient → POST /auth/register → AuthController → AuthService → repository/database`.
FE discards legacy JWT, clears password fields and displays success. Login is a separate action. Choosing a package is a separate authenticated Member page.

Public home shows Gym/Yoga/Boxing descriptions and loads anonymous package data. It never requests the class list. The class route requires sign-in; authenticated Member/Coach/Manager pages use their protected class or schedule APIs.

Verification reads a token from the hash link, waits for an explicit click and posts it to the configured endpoint. Only the response determines success/invalid/expired. Resend sends email to BE, displays a generic accepted message and starts a client cooldown. BE must enforce the real limit and token lifetime.

## If the lecturer asks about Thymeleaf

Spring MVC/Thymeleaf: browser GET → Controller → Service/Repository → Model → template rendered on server → HTML returned. POST form is validated with @Valid/BindingResult; success often redirects with a flash attribute.

This project: browser gets React assets → React fetches JSON from REST controllers → state updates → React renders HTML in browser. Success panel/state replaces the visible role of a flash message. Do not claim this repository contains Thymeleaf view controllers that were never implemented.

## Debug exercise

Open Network, inspect URL/method/body/status; verify field names; never log passwords or OTP values. A 401 on the class endpoint means it is not public. Empty packages and an unavailable class service are different states. A server registration failure must not show account-created success. OTP routes are `/auth/verify-email` and `/auth/resend-otp`; actual mail delivery requires Gmail SMTP configured on the backend, while browser fixtures only test UI states.
