type CheckoutResult = {
  checkoutUrl?: string | null;
};

export function getCheckoutUrlOrThrow(
  result: CheckoutResult,
  getSafeCheckoutUrl: (url: string) => string
): string {
  if (!result.checkoutUrl) {
    throw new Error('No checkout URL received from server');
  }

  return getSafeCheckoutUrl(result.checkoutUrl);
}
