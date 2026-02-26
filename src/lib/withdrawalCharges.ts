export const TDS_RATE = 0.1;
export const ADMIN_RATE = 0.05;

export function calculateWithdrawalCharges(amount: number) {
  const gross = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const tdsAmount = gross * TDS_RATE;
  const adminAmount = gross * ADMIN_RATE;
  const totalDeduction = tdsAmount + adminAmount;
  const netAmount = Math.max(gross - totalDeduction, 0);

  return {
    gross,
    tdsRate: TDS_RATE,
    adminRate: ADMIN_RATE,
    tdsAmount,
    adminAmount,
    totalDeduction,
    netAmount
  };
}