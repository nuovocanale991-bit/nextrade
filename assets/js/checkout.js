// Nextrade Checkout — Lemon Squeezy integration
// Replace LEMON_SQUEEZY_*_URL constants with real checkout URLs from your LS dashboard.
// Each URL is a Lemon Squeezy Checkout Link (Variant link) for that plan.

const LS_CHECKOUT_URLS = {
  'pro':            'LEMON_SQUEEZY_PRO_MONTHLY_URL',
  'pro-annual':     'LEMON_SQUEEZY_PRO_ANNUAL_URL',
  'premium':        'LEMON_SQUEEZY_PREMIUM_MONTHLY_URL',
  'premium-annual': 'LEMON_SQUEEZY_PREMIUM_ANNUAL_URL'
};

// Optional: prefill customer email if you already have it
// Append ?checkout[email]=user@example.com to the LS URL

function redirectToCheckout(planKey) {
  const url = LS_CHECKOUT_URLS[planKey];
  if (!url || url.startsWith('LEMON_')) {
    console.warn('Checkout URL not configured for plan:', planKey);
    return false;
  }
  window.location.href = url;
  return true;
}

// Expose globally
window.NT_Checkout = { redirectToCheckout, LS_CHECKOUT_URLS };
