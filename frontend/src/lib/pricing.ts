/** Returns the monthly price in KES given a pre-discounted base price. */
export function computeMonthlyPrice(
  discountedBasePriceKes: string | number,
  regionSurchargeKes = 0,
  osAdditionalPriceKes = 0
): number {
  return Number(discountedBasePriceKes) + regionSurchargeKes + osAdditionalPriceKes;
}

/** Returns the total price in KES given a pre-discounted base price. */
export function computeTotalPrice(
  discountedBasePriceKes: string | number,
  termLength: number,
  quantity: number,
  regionSurchargeKes = 0,
  osAdditionalPriceKes = 0
): number {
  return computeMonthlyPrice(discountedBasePriceKes, regionSurchargeKes, osAdditionalPriceKes) * termLength * quantity;
}
