// Helper functions for calling backend API routes.
export async function getZones(date: string) {
  const res = await fetch(`/api/zones?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    throw new Error('Failed to fetch zones');
  }
  return res.json() as Promise<{ zones: any[] }>;
}

export async function createOrder(payload: any) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to create order');
  }
  return res.json();
}