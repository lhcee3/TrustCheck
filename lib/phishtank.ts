const PHISHTANK_URL = "https://checkurl.phishtank.com/checkurl/";

interface PhishTankResponse {
  results: {
    url: string;
    in_database: boolean;
    phish_id?: string;
    phish_detail_page?: string;
    verified?: boolean;
    verified_at?: string;
    valid?: boolean;
  };
}

export async function checkPhishTank(
  url: string
): Promise<{ isPhishing: boolean; source: "PhishTank" }> {
  try {
    const body = new URLSearchParams({
      url: url.trim(),
      format: "json",
      app_key: process.env.PHISHTANK_API_KEY ?? "",
    });

    const res = await fetch(PHISHTANK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) return { isPhishing: false, source: "PhishTank" };

    const data: PhishTankResponse = await res.json();
    const isPhishing = data.results.in_database && data.results.verified === true;

    return { isPhishing, source: "PhishTank" };
  } catch {
    return { isPhishing: false, source: "PhishTank" };
  }
}
