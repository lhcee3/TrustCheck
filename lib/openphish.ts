const MOCK_PHISHING_URLS = [
  "sbi-update.vercel.app",
  "hdfc-verification.com",
  "paytm-kyc-update.net",
  "icici-secure-login.xyz",
  "upi-reward-claim.in",
  "axis-bank-alert.tk",
];

function normalize(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
}

export async function checkOpenPhish(
  url: string
): Promise<{ isPhishing: boolean; source: "OpenPhish" }> {
  const normalized = normalize(url);
  const isPhishing = MOCK_PHISHING_URLS.some((phish) => normalized.includes(phish));
  return { isPhishing, source: "OpenPhish" };
}
