import { redirect } from "next/navigation";

// Send money is handled via modal on the dashboard
export default function SendMoneyPage() {
  redirect("/xpressbank/dashboard");
}
