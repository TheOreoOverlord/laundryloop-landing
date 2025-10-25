import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getZones } from '@/utils/api';

interface Zone {
  id: string;
  name: string;
  capacity_per_day: number;
  is_available: boolean;
  available_spots: number;
  price: number;
  overflow_price: number;
  express_price: number;
}

export default function Book() {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [express, setExpress] = useState(false);

  useEffect(() => {
    if (date) {
      getZones(date)
        .then((res) => {
          setZones(res.zones as any);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [date]);

  const handleNext = () => {
    if (!date || !selectedZoneId) return;
    const query: any = { date, zoneId: selectedZoneId };
    if (express) query.express = '1';
    router.push({
      pathname: '/schedule',
      query
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Book Laundry Pickup</h1>
      <div className="mb-4">
        <label className="block mb-1">Select pickup date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>
      {date && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Available Zones</h2>
          {zones.length === 0 && (
            <p className="text-gray-600">No zones available for this date.</p>
          )}
          <ul className="space-y-2">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className={`border rounded p-3 cursor-pointer ${
                  selectedZoneId === zone.id ? 'border-blue-500' : 'border-gray-200'
                }`}
                onClick={() => setSelectedZoneId(zone.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{zone.name}</span>
                  <span>
                    {zone.is_available
                      ? `${zone.available_spots} spots left`
                      : 'Full (overflow)'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  <span>Base: ${zone.price.toFixed(2)}</span>
                  {zone.overflow_price > zone.price && !zone.is_available && (
                    <span> (overflow ${zone.overflow_price.toFixed(2)})</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedZoneId && (
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={express}
              onChange={(e) => setExpress(e.target.checked)}
              className="mr-2"
            />
            Express pickup (extra fee)
          </label>
        </div>
      )}
      <button
        disabled={!selectedZoneId}
        onClick={handleNext}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Next: Schedule Time
      </button>
    </div>
  );
}