import { ReactNode } from "react";

interface Props {
  label: string;
  value: string;
  icon: ReactNode;
  sub?: string;
  gradient?: boolean;
  visible?: boolean;
}

export default function BalanceCard({ label, value, icon, sub, gradient = false, visible = true }: Props) {
  const base = "rounded-2xl p-5 flex flex-col gap-3 shadow-sm";
  const bg = gradient
    ? `${base} bg-linear-to-br from-blue-600 to-blue-500 text-white`
    : `${base} bg-white border border-slate-100 text-slate-800`;

  return (
    <div className={bg}>
      <div className={`flex items-center gap-2 text-xs font-medium ${gradient ? "text-blue-100" : "text-slate-500"}`}>
        {icon} {label}
      </div>
      <p className={`text-2xl font-bold tracking-tight ${gradient ? "text-white" : "text-slate-800"}`}>
        {visible ? value : "••••••"}
      </p>
      {sub && <p className={`text-xs ${gradient ? "text-blue-100" : "text-slate-400"}`}>{sub}</p>}
    </div>
  );
}
