# Payment setup
- [x] Securely collect the user's Stripe secret key.
- [x] Confirm the existing build succeeds and all three endpoints reject incomplete or unsigned requests locally.
- [ ] Verify a complete Stripe checkout and paid order update; blocked by the webhook signing secret and a deployed public callback endpoint (the uploaded /api/payments webhook paths are not public callbacks).
- [ ] Help the user obtain Stripe's webhook signing secret after the public callback endpoint is deployed; publishing requires the user's request.
- [ ] Configure NOWPayments; blocked by the user's NOWPayments API key, IPN secret, and chosen NAD/USD exchange rate.
# Order slips
- [x] Replace customer discount-card pages, checkout and owner card controls with order slips.
- [x] Add stamped screenshot-ready slips for guest and account orders; hosted checkout saves its pending-order slip when payment setup succeeds.
- [x] Verify guest and signed-in order submission, downloaded PNG, slip reopening without browser snapshots, old-card redirect and mobile layout. Verification orders cancelled.
