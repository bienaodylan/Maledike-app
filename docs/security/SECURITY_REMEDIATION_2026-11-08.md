# MALÉDIKÉ PARTY — Security remediation status (2026-11-08)

## PR
- Draft: https://github.com/bienaodylan/Maledike-app/pull/2
- Branch: `security/appsec-remediation-2026-11`
- Do not merge until GitHub Actions passes and staging payment is tested.

## Implemented in source
- Orders created through `create_order_atomic` with DB advisory lock/capacity and active digital-product price; API validates integer quantity 1–10 and uses verified Supabase user's email.
- Fulfillment exclusively calls `fulfill_geniuspay_order`; tickets/QR generation are DB-atomic and replay-safe.
- GeniusPay webhook signature: `HMAC-SHA256(timestamp + "." + raw body, webhook secret)`, 300-second window, `X-Webhook-Signature`, `X-Webhook-Timestamp`, `payment.success`; amount, currency and reference mandatory.
- `APP_URL` is the only payment redirect origin. `GENIUSPAY_API_BASE` is deployment configuration.
- Durable event/site asset/profile/order/ticket/admin analytics persistence in Supabase. Public visual asset row seeded from previous db.json values.
- Upload MIME allowlist, magic bytes, 5 MiB cap, random filename and Storage bucket `site-assets`.
- Strict 100 KiB JSON, API JSON 404/parser errors, origin guard, login/register/scanner throttles.
- Gateway credential editing and production data purge disabled. Digital products/downloads disabled pending private files.
- Vercel global CSP/security headers. QR generated locally. Session revocation endpoint and browser cleanup on logout.
- Committed `data/db.json` removed. Gitleaks/Dependabot CI added.

## CI
Gitleaks and npm audit/build passed on an earlier branch commit. Latest workflow adds `tsc --noEmit` and API smoke tests; current run must be checked after the final server.ts change. A prior lint identified a scoped payment-data issue and it has been fixed; rerun required.

## Known residuals / not certified
- Admin TOTP enrollment UI/API not yet delivered. `ADMIN_REQUIRE_MFA=true` AAL2 gate is intentionally OFF until founder enrolls and recovery is verified.
- JWT remains in browser `localStorage`; CSP lowers risk but any successful XSS can steal it. HttpOnly cookie migration remains recommended.
- Scanner access token remains in the scanner URL/query (logs/history/referrer risk); QR is local now, but scanner flow should move to a one-time exchange or secure session.
- Remaining legacy `readDb/saveDb` helper/fallback code still exists for some noncritical flows; remove after every admin/public route is reconciled to Supabase.
- Edge Functions already deployed remain active until the retired source is deployed/disabled in Supabase; current PR only changes repository source.
- No proof yet for race test last seat, IDOR across all routes, invalid/replayed webhook fixtures, invalid uploads with founder token, or simultaneous double scan; the smoke suite only covers anonymous and malformed cases.
- Strict CSP must be checked in a browser; third-party/inline requirements can break the UI.

## Founder-only actions — not performed
1. Rotate/recreate exposed GeniusPay public/secret/webhook credentials, Supabase service_role, GitHub/Vercel tokens.
2. Put only in Vercel secrets: `GENIUSPAY_PUBLIC_KEY`, `GENIUSPAY_SECRET_KEY`, `GENIUSPAY_WEBHOOK_SECRET`, `GENIUSPAY_API_BASE`, `APP_URL`, `ROOT_ADMIN_EMAIL`.
3. Set `ADMIN_REQUIRE_MFA=true` only after TOTP enrollment and recovery are tested.
4. Enable Supabase Auth leaked-password protection; activate MFA/2FA on GitHub, Vercel, Supabase, Google/email; revoke old sessions.
5. Reconcile 13 expired pending orders against GeniusPay before canceling or deleting anything.
6. Confirm the GeniusPay webhook points to the single intended Express endpoint and complete a Sandbox payment end-to-end.
