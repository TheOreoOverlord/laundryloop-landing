import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { ZoneAvailability } from '../../types';

// Initialize Supabase client using environment variables.  Use the service
// role key server‑side to perform unrestricted reads.  Do not expose the
// service role key to the client.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false }
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      return getZones(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

/**
 * GET /api/zones
 * Returns list of zones along with computed availability for a given date.
 * Query params:
 *   date (YYYY‑MM‑DD) – required
 */
async function getZones(req: NextApiRequest, res: NextApiResponse) {
  const { date } = req.query;
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid date parameter' });
  }

  // Fetch all zones
  const { data: zones, error: zonesError } = await supabase
    .from('zones')
    .select('*');
  if (zonesError) {
    console.error('Error fetching zones', zonesError);
    return res.status(500).json({ error: 'Failed to fetch zones' });
  }

  // Compute order counts per zone for the given date
  const { data: counts, error: countError } = await supabase
    .from('orders')
    .select('zone_id, count(*)', { count: 'exact' })
    .eq('pickup_date', date)
    .group('zone_id');
  if (countError) {
    console.error('Error counting orders', countError);
    return res.status(500).json({ error: 'Failed to compute availability' });
  }

  // Convert counts array into a map for quick lookup
  const countMap: Record<number, number> = {};
  (counts || []).forEach((row: any) => {
    countMap[row.zone_id] = row.count;
  });

  const availability: ZoneAvailability[] = (zones || []).map((zone: any) => {
    const ordersCount = countMap[zone.id] ?? 0;
    const availableSlots = zone.capacity_per_day - ordersCount;
    return {
      ...zone,
      date,
      orders_count: ordersCount,
      available_slots: Math.max(availableSlots, 0)
    } as ZoneAvailability;
  });

  return res.status(200).json({ zones: availability });
}
