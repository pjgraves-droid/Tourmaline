# Tourmaline House

Standalone holiday-rental booking site for a Nordic-style wellness retreat in Pearl Beach, NSW. It includes a responsive listing page, local photo gallery, date-aware pricing, SQLite/Prisma availability, Stripe Checkout, Airbnb iCal sync, an owner dashboard, and an iCal feed for exporting paid bookings.

## Setup

1. Install Node 20 LTS.
2. Copy `.env.example` to `.env` and fill in the values you need. A local `.env` with safe development defaults is included in this working copy but is gitignored.
3. Install dependencies and create the SQLite schema:

   ```bash
   npm install
   npx prisma db push
   npm run dev
   ```

   Open http://localhost:3000.

## Stripe

Create a Stripe account and add a test secret key as `STRIPE_SECRET_KEY`. Add the webhook signing secret as `STRIPE_WEBHOOK_SECRET`. During local development, install the Stripe CLI and run:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The checkout API returns a clear 503 and the booking interface remains disabled until a Stripe secret key is configured.

## Airbnb calendar sync

In Airbnb, open **Calendar → Availability → Connect calendars → Export** and put the iCal URL in `AIRBNB_ICAL_URL`. The app lazily syncs it at most once per hour when availability is requested. Owners can also use **/admin → Sync Airbnb calendar now**. To import this site’s paid bookings back into Airbnb, add `https://your-domain.example/api/ical` as an Airbnb calendar under **Connect calendars → Import**.

## Hospitable integration

Hospitable is optional. Add a Personal Access Token from **Hospitable → Apps → API access → Personal Access Tokens** as `HOSPITABLE_API_TOKEN`, then optionally set `HOSPITABLE_PROPERTY_ID`. The owner dashboard can list available properties and save the selected property.

When enabled, the app treats Hospitable as the source of truth for the listing title, description, address, amenities, photos, availability, and nightly prices. A manual or lazy sync fetches property data and images, then refreshes an 18-month calendar in 90-day chunks. Lazy synchronization runs when the cached sync is more than 60 minutes old. Hospitable calendar prices are used before the editable static pricing engine and the weekly discount is not applied to those live prices.

After Stripe marks a booking paid, the app creates an idempotent reservation in Hospitable using the local booking reference. A reservation push failure never changes the local paid state; the error is shown in `/admin` with a retry action. `HOSPITABLE_CHANNEL` can be set when a valid Hospitable channel value is required. `HOSPITABLE_USE_QUOTE=true` optionally probes Hospitable’s quote endpoint and falls back to the calendar sum when that endpoint is unavailable or returns an unrecognised shape.

If Hospitable is not configured or has not been synced, the existing static listing content and `src/data/pricing.ts` remain active. Airbnb iCal remains the availability fallback. When Hospitable is enabled, a Hospitable-created reservation blocks the property through Hospitable, so importing `/api/ical` back into Airbnb is no longer needed for that booking flow.

## Pricing

Edit `src/data/pricing.ts` to change weekday/weekend rates, seasonal windows, cleaning fee, minimum stay, maximum guests, or the weekly discount. All configured amounts are whole Australian dollars.

## Export / deployment

To zip the self-contained project, run `zip -r tourmaline-house.zip . -x 'node_modules/*' '.next/*' 'prisma/dev.db'`. The repository includes all photo assets in `public/photos`, so it can be moved without external listing dependencies.

For a simple deployment, use Vercel with `NEXT_PUBLIC_SITE_URL` and the Stripe/Airbnb secrets configured. SQLite is suitable for a local owner-operated site; for multi-instance production hosting, swap Prisma’s datasource to Postgres or Turso and use persistent storage.
