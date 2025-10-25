import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Order, Zone } from '../../types';

// Pricing constants (in cents)
const BASE_PRICE = 1000;        // $10 per order
const EXPRESS_SURCHARGE = 500;  // +$5 for express service
const OVERFLOW_SURCHARGE = 300; // +$3 when zone capacity is exceeded
const BONUS_POOL_CENTS = 250;   // $2.50 goes into the bonus pool per order

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      return getOrders(req, res);
    case 'POST':
      return createOrder(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

/**
 * GET /api/orders
 * Returns a list of orders for the authenticated user.  If the request
 * includes a user_id query param, only orders for that user are returned.
 */
async function getOrders(req: NextApiRequest, res: NextApiResponse) {
  const { user_id } = req.query;
  let query = supabase.from('orders').select('*');
  if (user_id && typeof user_id === 'string') {
    query = query.eq('user_id', user_id);
  }
  const { data: orders, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching orders', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
  return res.status(200).json({ orders });
}

/**
 * POST /api/orders
 * Creates a new order.  The request body must include:
 *   zone_id: number
 *   pickup_date: string (YYYY-MM-DD)
 * Optional:
 *   is_express: boolean
 *   notes: string
 *   user_id: string (for authenticated context)
 *
 * The handler computes whether the order is overflow (zone capacity exceeded)
 * and calculates pricing accordingly.  It then inserts the order and
 * associated ledger entries.
 */
async function createOrder(req: NextApiRequest, res: NextApiResponse) {
  const { zone_id, pickup_date, is_express = false, notes, user_id } = req.body;
  if (!zone_id || !pickup_date || typeof zone_id !== 'number' || typeof pickup_date !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid zone_id or pickup_date' });
  }

  // Fetch zone to get capacity
  const { data: zone, error: zoneErr } = await supabase
    .from<Zone>('zones')
    .select('*')
    .eq('id', zone_id)
    .single();
  if (zoneErr || !zone) {
    console.error('Error fetching zone', zoneErr);
    return res.status(400).json({ error: 'Invalid zone_id' });
  }

  // Count existing orders for the zone/date
  const { count: ordersCount, error: countErr } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('zone_id', zone_id)
    .eq('pickup_date', pickup_date);
  if (countErr || ordersCount === null) {
    console.error('Error counting orders', countErr);
    return res.status(500).json({ error: 'Failed to compute capacity' });
  }

  const isOverflow = ordersCount >= zone.capacity_per_day;

  // Calculate price
  let price = BASE_PRICE;
  if (is_express) price += EXPRESS_SURCHARGE;
  if (isOverflow) price += OVERFLOW_SURCHARGE;

  // Insert order
  const { data: order, error: orderErr } = await supabase
    .from<Order>('orders')
    .insert({
      user_id: user_id ?? null,
      zone_id,
      pickup_date,
      is_express,
      is_overflow: isOverflow,
      price_cents: price,
      notes: notes ?? null
    })
    .single();
  if (orderErr || !order) {
    console.error('Error creating order', orderErr);
    return res.status(500).json({ error: 'Failed to create order' });
  }

  // Record ledger entries: order revenue and bonus pool contribution
  const ledgerEntries = [
    {
      order_id: order.id,
      amount_cents: price,
      type: 'order',
      description: 'Order payment'
    },
    {
      order_id: order.id,
      amount_cents: BONUS_POOL_CENTS,
      type: 'bonus_pool',
      description: 'Bonus pool contribution'
    }
  ];

  const { error: ledgerErr } = await supabase.from('ledger').insert(ledgerEntries);
  if (ledgerErr) {
    console.error('Error creating ledger entries', ledgerErr);
    // Note: we intentionally do not rollback the order here; manual cleanup may be required
  }

  // TODO: integrate Stripe Checkout session creation, Twilio SMS, and email notification
  // These calls should be performed server-side with the appropriate SDKs and
  // environment variables.  At this point we simply return the order and
  // computed pricing information.
  return res.status(201).json({ order, price_cents: price, overflow: isOverflow });
}
