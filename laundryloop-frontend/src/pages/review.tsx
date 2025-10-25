import { useRouter } from 'next/router';
import { useState } from 'react';
import { createOrder } from '@/utils/api';

export default function Review() {
  const router = useRouter();
  const { zoneId, date, express } = router.query;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!zoneId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const orderPayload = {
        zone_id: zoneId,
        pickup_date: date,
        express: express === '1'
      };
      const data = await createOrder(orderPayload);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Review Your Order</h1>
      <p>Zone: {zoneId as string}</p>
      <p>Date: {date as string}</p>
      <p>Express: {express === '1' ? 'Yes' : 'No'}</p>
      {error && <p className="text-red-600">{error}</p>}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded mt-4 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Confirm & Pay'}
      </button>
    </div>
  );
}