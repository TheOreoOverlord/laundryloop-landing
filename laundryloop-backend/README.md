# LaundryLoop Backend

This repository contains the server‑side components for **LaundryLoop**, a zone‑based laundry pickup and scheduling platform.  It includes a Supabase schema, TypeScript types, REST API endpoints for Next.js, and configuration templates for payment, scheduling, email, and SMS integrations.

## Architecture Overview

* **Database**: Supabase (Postgres) stores zones, orders, and financial ledger entries.  Supabase Auth manages users.
* **API**: Next.js API routes provide endpoints for zones, orders, ledger, and Stripe webhooks.
* **Payments**: Stripe Checkout handles customer payments; webhooks update order status.
* **Notifications**: Twilio (SMS) and SendGrid/Mailgun (email) can be integrated for confirmations and reminders.
* **Scheduling**: Capacity per zone and per day is enforced server‑side.  Overflow and express orders apply surcharges.
* **Bonus Pool**: Each order contributes $2.50 to a bonus pool tracked in the `ledger` table.

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/laundryloop-backend.git
   cd laundryloop-backend
   ```

2. **Set up Supabase**

   Create a new Supabase project via the [Supabase dashboard](https://app.supabase.com).  Then:

   * Create a new SQL query and run the contents of `supabase-schema.sql` to create the tables and seed initial zones.
   * Enable the `uuid-ossp` extension in the database if it is not already enabled.
   * Note your project URL, anon key, and service role key from the Supabase dashboard.

3. **Configure environment variables**

   Copy the provided `.env.example` file to `.env.local` and fill in the values:

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key for client‑side calls
   - `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key for server‑side operations
   - `STRIPE_SECRET_KEY` – Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` – Stripe webhook signing secret
   - Email provider keys (`SENDGRID_API_KEY` or `MAILGUN_API_KEY`)
   - Twilio credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)
   - Pricing constants may be overridden if needed

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Run locally**

   Start the Next.js development server:

   ```bash
   npm run dev
   ```

   The API endpoints will be available at `http://localhost:3000/api/*`.

6. **Stripe Webhooks**

   Set up a Stripe webhook endpoint pointing to `/api/webhooks/stripe`.  When testing locally, you can use [`stripe-cli`](https://stripe.com/docs/stripe-cli) to forward events:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## API Endpoints

### `GET /api/zones?date=YYYY-MM-DD`

Returns available zones and capacity for a given date.

### `POST /api/orders`

Creates a new order.  Request body JSON:

```json
{
  "zone_id": 1,
  "pickup_date": "2025-10-30",
  "is_express": false,
  "notes": "Please leave at back door",
  "user_id": "<optional-user-id>"
}
```

Returns the created order along with computed price and overflow flag.

### `GET /api/orders?user_id=<uuid>`

Retrieves orders.  If `user_id` is provided, filters to that user.

### `GET /api/ledger?order_id=<uuid>`

Returns ledger entries.  Intended for admin or reporting use.

### `POST /api/webhooks/stripe`

Handles Stripe webhook events (e.g., `checkout.session.completed`) and updates order status.

## Development Notes

- Keep all secrets and API keys out of source control.  Use environment variables instead.
- Pricing constants are defined in `src/pages/api/orders.ts` but can be overridden via environment variables.
- Email and SMS notifications are not implemented in this starter; integrate with your chosen provider in the order creation flow.
- The code assumes a simple daily capacity per zone.  If you require finer granularity (e.g., hourly slots), extend the schema accordingly.

## License

This project is provided for educational purposes.  Customize and adapt it to suit your business requirements.
