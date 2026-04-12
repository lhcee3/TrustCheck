const MOCK_PHISHING_URLS = [
  "secure-hdfc-login.com",
  "sbi-netbanking-verify.com",
  "paytm-cashback-offer.net",
  "upi-pin-reset.in",
  "icici-account-blocked.xyz",
];

function normalize(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
}

export async function checkPhishTank(
  url: string
): Promise<{ isPhishing: boolean; source: "PhishTank" }> {
  const normalized = normalize(url);
  const isPhishing = MOCK_PHISHING_URLS.some((phish) => normalized.includes(phish));
  return { isPhishing, source: "PhishTank" };
}
