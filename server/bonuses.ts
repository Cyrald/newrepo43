export function calculateCashback(
  orderAmount: number,
  usedBonuses: boolean,
  usedPromocode: boolean
): number {
  if (usedBonuses || usedPromocode) {
    return 0;
  }

  if (orderAmount < 1000) {
    return Math.floor(orderAmount * 0.03);
  } else if (orderAmount < 2500) {
    return Math.floor(orderAmount * 0.05);
  } else if (orderAmount < 10000) {
    return Math.floor(orderAmount * 0.07);
  } else {
    return Math.floor(orderAmount * 0.10);
  }
}

export function canUseBonuses(
  bonusBalance: number,
  orderSubtotal: number
): { maxUsable: number; twentyPercent: number } {
  const twentyPercent = Math.floor(orderSubtotal * 0.2);
  const maxUsable = Math.min(bonusBalance, twentyPercent);

  return { maxUsable, twentyPercent };
}
