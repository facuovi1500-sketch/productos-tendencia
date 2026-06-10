export function toNumber(value: unknown): number {
  if (value == null) {
    return 0;
  }
  return Number(value);
}

export function orderFinancials(input: {
  quantity: number;
  amount: number;
  deposit?: number;
  productCost?: number;
  supplierCost?: number;
  amountPaid?: number;
}) {
  const supplierCost = input.supplierCost ?? input.quantity * (input.productCost ?? 0);
  const amountPaid = input.amountPaid ?? input.deposit ?? 0;
  const pendingBalance = Math.max(input.amount - amountPaid, 0);
  const estimatedProfit = input.amount - supplierCost;
  const realizedProfit = amountPaid - supplierCost;
  return { pendingBalance, estimatedProfit, realizedProfit, supplierCost, amountPaid };
}
