import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Schedule() {
  const router = useRouter();
  const { date, zoneId, express } = router.query;
  const [calUrl, setCalUrl] = useState('');

  useEffect(() => {
    if (date && zoneId) {
      const base = process.env.NEXT_PUBLIC_CALCOM_URL || '';
      const params = new URLSearchParams();
      params.set('date', String(date));
      if (express === '1') {
        params.set('express', '1');
      }
      setCalUrl(`${base}?${params.toString()}`);
    }
  }, [date, zoneId, express]);

  if (!date || !zoneId) {
    return <p className="p-4">Invalid booking data. Please start over.</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Schedule Your Pickup Time</h1>
      {calUrl ? (
        <iframe
          src={calUrl}
          style={{ width: '100%', height: '700px', border: 'none' }}
          allow="camera; microphone; fullscreen"
        />
      ) : (
        <p>Loading scheduler...</p>
      )}
    </div>
  );
}