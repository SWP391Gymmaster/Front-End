# FE1 request flow — presentation notes

## Actual React implementation

`main.jsx → StoreProvider → App → PublicApp → RegisterForm`.
Register submit validates the form, calls `publicService.register → createApiClient → POST /auth/register → AuthController → AuthService → repository/database`. FE clears password fields and displays the email-verification instruction. Registration does not save a session or automatically sign in. Login and package purchase are separate actions.

The user opens the single-use link from email at `/verify-email?token=...`. FE calls `POST /auth/verify-email` with `{token}` and renders success or BE's failure/expiry message. Resend calls `POST /auth/resend-verification` with `{email}`. BE owns token validation, expiry, and email delivery.

Public home shows Gym/Yoga/Boxing and loads active packages. It never requests the class list. Anonymous class route requires sign-in; authenticated Member/Coach/Manager pages use protected class and schedule APIs.

## If the lecturer asks about Thymeleaf

Spring MVC/Thymeleaf: browser GET → Controller → Service/Repository → Model → template rendered on server → HTML returned. POST form is validated with `@Valid`/`BindingResult`; success often redirects with a flash attribute.

This project: browser gets React assets → React fetches JSON from REST controllers → state updates → React renders HTML in browser. Success UI/state replaces the visible role of a flash message. This repository does not contain Thymeleaf view controllers.

## Debug exercise

Open Network, inspect URL/method/body/status; verify field names; never log passwords or verification tokens. A 401 on the class endpoint means it is not public. Empty packages and an unavailable class service are different states. A server registration failure must not show account-created success. Email routes are `/auth/verify-email` and `/auth/resend-verification`; real delivery requires SMTP configuration on BE, while browser fixtures only test UI states.
