import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { LedgerEntry } from '../../types';

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
      return getLedger(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

/**
 * GET /api/ledger
 * Returns ledger entries.  This endpoint is intended for administrators
 * or reporting purposes and should be protected by authentication/authorization.
 * Optional query params:
 *   order_id: string – filter to a specific order
 */
async function getLedger(req: NextApiRequest, res: NextApiResponse) {
  const { order_id } = req.query;
  let query = supabase.from<LedgerEntry>('ledger').select('*');
  if (order_id && typeof order_id === 'string') {
    query = query.eq('order_id', order_id);
  }
  const { data: entries, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching ledger', error);
    return res.status(500).json({ error: 'Failed to fetch ledger' });
  }
  return res.status(200).json({ ledger: entries });
}
