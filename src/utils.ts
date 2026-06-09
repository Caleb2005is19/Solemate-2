export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const reportClientLog = async (level: 'info' | 'warn' | 'error', message: string, metadata?: any) => {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, metadata })
    });
  } catch (err) {
    console.warn('Logging server is unreachable:', err);
  }
};
