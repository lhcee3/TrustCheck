"use client";

import { useState } from "react";
import { Link2, ScanSearch, FileDown, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

type Tab = "link" | "account";

interface LinkResult {
  url: string;
  riskScore: number;
  sources: { openphish: boolean; phishtank: boolean };
  recommendation: string;
}

interface AccountResult {
  found: boolean;
  riskScore: number;
  complaints: number;
  recommendation: string;
}

function RecommendationBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    HOLD: "bg-red-500/20 text-red-400 border-red-500/30",
    CONFIRM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    ALLOW: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${styles[value] ?? "bg-gray-700 text-gray-300"}`}>
      {value}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function generatePDFReport(
  checkResult: LinkResult | AccountResult,
  type: "link" | "account",
  inputValue: string
) {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const pageW = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(67, 56, 202); // indigo-700
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TrustCheck Fraud Investigation Report", pageW / 2, 17, { align: "center" });

  // Meta
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${dateStr}`, 14, 38);
  doc.text(`Report Type: ${type === "link" ? "URL / Link Check" : "UPI Account Check"}`, 14, 46);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 52, pageW - 14, 52);

  // Checked item
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(type === "link" ? "Checked URL:" : "Checked UPI ID:", 14, 62);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(inputValue, 14, 70, { maxWidth: pageW - 28 });

  // Risk score (large)
  const score = checkResult.riskScore;
  const scoreColor: [number, number, number] =
    score > 70 ? [220, 38, 38] : score >= 30 ? [202, 138, 4] : [22, 163, 74];
  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...scoreColor);
  doc.text(`${score}`, pageW / 2, 100, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text("Risk Score / 100", pageW / 2, 110, { align: "center" });

  // Divider
  doc.line(14, 118, pageW - 14, 118);

  // Breakdown
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Risk Breakdown", 14, 128);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);

  let y = 138;
  if (type === "link" && "sources" in checkResult) {
    doc.text(`OpenPhish:   ${checkResult.sources.openphish ? "FLAGGED" : "Clean"}`, 14, y); y += 10;
    doc.text(`PhishTank:   ${checkResult.sources.phishtank ? "FLAGGED" : "Clean"}`, 14, y); y += 10;
  } else if (type === "account" && "complaints" in checkResult) {
    doc.text(`Found in database:   ${checkResult.found ? "Yes" : "No"}`, 14, y); y += 10;
    doc.text(`Complaints filed:    ${checkResult.complaints}`, 14, y); y += 10;
  }

  // Recommendation
  y += 4;
  doc.line(14, y, pageW - 14, y); y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text("Recommendation:", 14, y); y += 10;
  doc.setFontSize(18);
  doc.setTextColor(...scoreColor);
  doc.text(checkResult.recommendation, 14, y);

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200);
  doc.line(14, pageH - 18, pageW - 14, pageH - 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text("For internal bank use only — TrustCheck © Team Tiger Claw", pageW / 2, pageH - 10, { align: "center" });

  const filename = type === "link"
    ? `trustcheck-link-report-${Date.now()}.pdf`
    : `trustcheck-account-report-${Date.now()}.pdf`;
  doc.save(filename);
}

export default function CheckerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("link");

  const [linkUrl, setLinkUrl] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkResult, setLinkResult] = useState<LinkResult | null>(null);

  const [accountUpi, setAccountUpi] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountResult, setAccountResult] = useState<AccountResult | null>(null);

  async function checkLink() {
    if (!linkUrl.trim()) return;
    setLinkLoading(true);
    setLinkResult(null);
    try {
      const res = await fetch(`/api/check-link?url=${encodeURIComponent(linkUrl.trim())}`);
      setLinkResult(await res.json());
    } finally {
      setLinkLoading(false);
    }
  }

  async function checkAccount() {
    if (!accountUpi.trim()) return;
    setAccountLoading(true);
    setAccountResult(null);
    try {
      const res = await fetch(`/api/check-account?upiId=${encodeURIComponent(accountUpi.trim())}`);
      setAccountResult(await res.json());
    } finally {
      setAccountLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "link", label: "Check Link", icon: <Link2 className="w-4 h-4" /> },
    { id: "account", label: "Check Account", icon: <ScanSearch className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <main className="flex-1 flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-lg flex flex-col gap-6">

          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-900 border border-gray-800 p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Check Link */}
          {activeTab === "link" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkLink()}
                  className="flex-1 rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  onClick={checkLink}
                  disabled={linkLoading || !linkUrl.trim()}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors px-5 py-3 text-sm font-medium"
                >
                  {linkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
                </button>
              </div>

              {linkResult && (
                <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 flex flex-col gap-1">
                  <Row label="URL" value={<span className="truncate max-w-[220px] block text-right">{linkResult.url}</span>} />
                  <Row label="Risk Score" value={<span className={linkResult.riskScore > 70 ? "text-red-400" : linkResult.riskScore >= 30 ? "text-yellow-400" : "text-emerald-400"}>{linkResult.riskScore} / 100</span>} />
                  <Row label="OpenPhish" value={linkResult.sources.openphish ? "🚨 Flagged" : "✅ Clean"} />
                  <Row label="PhishTank" value={linkResult.sources.phishtank ? "🚨 Flagged" : "✅ Clean"} />
                  <Row label="Recommendation" value={<RecommendationBadge value={linkResult.recommendation} />} />
                  <button
                    onClick={() => generatePDFReport(linkResult, "link", linkUrl)}
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors py-2.5 text-sm font-medium text-gray-300"
                  >
                    <FileDown className="w-4 h-4" />
                    Generate PDF Report
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Check Account */}
          {activeTab === "account" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. scammer@okhdfcbank"
                  value={accountUpi}
                  onChange={(e) => setAccountUpi(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkAccount()}
                  className="flex-1 rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  onClick={checkAccount}
                  disabled={accountLoading || !accountUpi.trim()}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors px-5 py-3 text-sm font-medium"
                >
                  {accountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
                </button>
              </div>

              {accountResult && (
                <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 flex flex-col gap-1">
                  <Row label="Found" value={accountResult.found ? "Yes" : "No"} />
                  <Row label="Risk Score" value={<span className={accountResult.riskScore > 70 ? "text-red-400" : "text-emerald-400"}>{accountResult.riskScore} / 100</span>} />
                  <Row label="Complaints" value={accountResult.complaints} />
                  <Row label="Recommendation" value={<RecommendationBadge value={accountResult.recommendation} />} />
                  <button
                    onClick={() => generatePDFReport(accountResult, "account", accountUpi)}
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors py-2.5 text-sm font-medium text-gray-300"
                  >
                    <FileDown className="w-4 h-4" />
                    Generate PDF Report
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
