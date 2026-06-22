# Stripe Setup — TrackMa Billing

TrackMa uses Stripe for subscription billing. This guide covers setting up products, price IDs, and webhooks.

## Pricing Tiers

| Tier | Vehicles | Monthly Price (MAD) | Stripe Env Var |
|---|---|---|---|
| Starter | Up to 5 | 299 MAD | `STRIPE_PRICE_STARTER` |
| Pro | Up to 25 | 799 MAD | `STRIPE_PRICE_PRO` |
| Business | Unlimited | 1,999 MAD | `STRIPE_PRICE_BUSINESS` |

> Adjust pricing as needed. The tier names and limits are defined in `apps/api/src/modules/billing/billing.service.ts`.

## Step 1: Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Click **+ Add product**
3. Create three products:

**Product 1 — TrackMa Starter**
- Name: `TrackMa Starter`
- Description: `Up to 5 vehicles`
- Pricing model: Standard pricing
- Price: 299.00 MAD / month (recurring)
- Copy the **Price ID** (looks like `price_1ABC...`) → set as `STRIPE_PRICE_STARTER`

**Product 2 — TrackMa Pro**
- Name: `TrackMa Pro`
- Description: `Up to 25 vehicles`
- Price: 799.00 MAD / month
- Copy Price ID → `STRIPE_PRICE_PRO`

**Product 3 — TrackMa Business**
- Name: `TrackMa Business`
- Description: `Unlimited vehicles`
- Price: 1999.00 MAD / month
- Copy Price ID → `STRIPE_PRICE_BUSINESS`

## Step 2: Get API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy **Secret key** (starts with `sk_test_` for test mode) → `STRIPE_SECRET_KEY`
3. Copy **Publishable key** (starts with `pk_test_`) → `STRIPE_PUBLISHABLE_KEY`

## Step 3: Set Up Webhook

### For Local Development (Stripe CLI)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli#install

# Login
stripe login

# Forward webhooks to local API
stripe listen --forward-to http://localhost:3001/api/billing/webhook

# The CLI prints a webhook signing secret like: whsec_xxxx
# Set it as STRIPE_WEBHOOK_SECRET in your .env
```

Keep the `stripe listen` command running while developing billing features.

### For Production

1. Go to https://dashboard.stripe.com/webhooks
2. Click **+ Add endpoint**
3. Endpoint URL: `https://trackma.ma/api/billing/webhook`
4. Events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. After creating, click **Reveal** under "Signing secret" → `STRIPE_WEBHOOK_SECRET`

## Step 4: Update .env

```env
STRIPE_SECRET_KEY=sk_test_51TZXZk...
STRIPE_PUBLISHABLE_KEY=pk_test_51TZXZk...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_1ABC...
STRIPE_PRICE_PRO=price_1DEF...
STRIPE_PRICE_BUSINESS=price_1GHI...
```

## Testing Billing Flow

Use Stripe's test card numbers:

| Scenario | Card Number | Expiry | CVC |
|---|---|---|---|
| Success | `4242 4242 4242 4242` | Any future | Any |
| Requires 3DS auth | `4000 0027 6000 3184` | Any future | Any |
| Payment declined | `4000 0000 0000 9995` | Any future | Any |

### Full test flow:

1. Register a new account on the app
2. Go to **Billing / Upgrade**
3. Select a plan → click **Upgrade**
4. You're redirected to Stripe Checkout
5. Enter test card `4242 4242 4242 4242`, any expiry/CVC
6. Complete checkout → redirected back to `/billing?success=1`
7. Your organization's `tier` and `vehicleLimit` should update in the database

### Verify webhook was processed:

```bash
# Check database
docker compose exec postgres psql -U trackma -d trackma \
  -c "SELECT name, tier, vehicle_limit, subscription_status FROM organizations;"
```

## Subscription Management

### Upgrading / Downgrading

Stripe handles proration automatically. When a customer upgrades mid-cycle, they're charged the difference.

### Cancellation

When `customer.subscription.deleted` fires, the webhook sets:
```json
{ "subscriptionStatus": "cancelled", "tier": "trial", "vehicleLimit": 2 }
```

The customer retains access until the end of the billing period (Stripe behavior).

### Trial to Paid

New organizations start on `trial` tier with 2 vehicle limit. The trial never expires automatically — customers upgrade when they need more vehicles.

## Currency Configuration

TrackMa is priced in MAD (Moroccan Dirham). Note that Stripe requires MAD amounts in **centimes** (multiply by 100):

- 299 MAD → `29900` in Stripe API
- The Stripe Dashboard handles the display currency automatically

Stripe supports MAD for North African businesses. Ensure your Stripe account is configured for Morocco.

## Going Live

1. Switch from test mode to live mode in the Stripe Dashboard
2. Replace `sk_test_` keys with `sk_live_` keys in production `.env`
3. Re-create the webhook endpoint for production URL
4. Re-create products/prices in live mode (test and live are separate)
5. Test with a real card for a small amount (refund after verification)
