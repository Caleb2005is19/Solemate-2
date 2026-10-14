/**
 * Utility helpers for formatting contact details, phone numbers,
 * and WhatsApp links across the website.
 */

/**
 * Normalizes any phone number input into international WhatsApp format (digits only, no '+' or spaces).
 * Handles Kenyan local numbers (07XX XXX XXX or 01XX XXX XXX) automatically.
 */
export function normalizeWhatsAppNumber(rawPhone?: string): string {
  if (!rawPhone) return '254700000000';
  
  // Remove all non-digits
  const digits = rawPhone.replace(/\D/g, '');
  
  // Kenyan local 10-digit number starting with 07... or 01... (e.g. 0712345678 -> 254712345678)
  if (digits.startsWith('0') && digits.length === 10) {
    return '254' + digits.substring(1);
  }
  
  // Already starting with 254
  if (digits.startsWith('254') && digits.length >= 12) {
    return digits;
  }

  // 9-digit without leading 0 (e.g. 712345678 -> 254712345678)
  if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
    return '254' + digits;
  }

  return digits || '254700000000';
}

/**
 * Formats a raw phone string into a friendly, readable Kenyan format (+254 7XX XXX XXX)
 */
export function formatDisplayPhone(rawPhone?: string): string {
  if (!rawPhone || !rawPhone.trim()) return '+254 700 000 000';

  const clean = rawPhone.trim();
  const digits = clean.replace(/\D/g, '');

  if (digits.startsWith('254') && digits.length === 12) {
    return `+254 ${digits.substring(3, 6)} ${digits.substring(6, 9)} ${digits.substring(9)}`;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `+254 ${digits.substring(1, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  }

  return clean;
}

/**
 * Builds a direct wa.me link with pre-filled message
 */
export function getWhatsAppChatUrl(phone?: string, message?: string): string {
  const digits = normalizeWhatsAppNumber(phone);
  if (!message) {
    return `https://wa.me/${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
