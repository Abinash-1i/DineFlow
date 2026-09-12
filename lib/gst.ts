/**
 * Indian Restaurant GST and Currency Utilities for DineFlow
 * Standard Restaurant GST: 5% (2.5% CGST + 2.5% SGST)
 */

export interface TaxBreakdown {
  subtotal: number;
  cgstRate: number; // 2.5%
  sgstRate: number; // 2.5%
  cgstAmount: number;
  sgstAmount: number;
  totalTax: number;
  discount: number;
  grandTotal: number;
  roundOff: number;
}

export function calculateRestaurantGST(
  subtotal: number,
  discount: number = 0
): TaxBreakdown {
  const taxableAmount = Math.max(0, subtotal - discount);
  const cgstRate = 2.5;
  const sgstRate = 2.5;

  const cgstAmount = Math.round(((taxableAmount * cgstRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((taxableAmount * sgstRate) / 100) * 100) / 100;
  const totalTax = Math.round((cgstAmount + sgstAmount) * 100) / 100;

  const rawTotal = taxableAmount + totalTax;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Math.round((grandTotal - rawTotal) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgstRate,
    sgstRate,
    cgstAmount,
    sgstAmount,
    totalTax,
    discount: Math.round(discount * 100) / 100,
    grandTotal,
    roundOff,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateSplitEqual(
  total: number,
  shares: number
): { perPerson: number; remainder: number } {
  if (shares <= 1) return { perPerson: total, remainder: 0 };
  const perPerson = Math.floor(total / shares);
  const remainder = total - perPerson * shares;
  return { perPerson, remainder };
}
