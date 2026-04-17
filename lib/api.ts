export interface User {
  id: string; name: string; email: string; phone: string; upiId: string;
  accountNumber: string; ifsc: string; branch: string; accountType: string;
  balance: number; avatarInitials: string; joinedDate: string; kycStatus: string;
  linkedCards: { last4: string; network: string; expiry: string }[];
}

export interface Transaction {
  id: string; userId: string; type: "sent" | "received" | "blocked";
  amount: number; recipientName: string; recipientUpi: string;
  senderName: string; senderUpi: string; note: string;
  category: string; timestamp: string; status: string;
  riskScore: number; trustCheckFlagged: boolean;
}

export interface Contact {
  id: string; userId: string; name: string; upiId: string; bank: string;
  avatarInitials: string; lastPaid: string | null; totalPaid: number;
}

export interface Notification {
  id: string; userId: string; type: string; title: string;
  body: string; read: boolean; timestamp: string;
}

export interface TransactionPayload {
  recipientUpi: string; recipientName: string; amount: number;
  note?: string; category?: string; riskScore?: number; trustCheckFlagged?: boolean;
}

export interface RiskPayload { upiId: string; amount?: number; userId?: string; }

const json = async <T>(res: Response): Promise<T> => {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const api = {
  getUser: () => fetch("/api/user").then((r) => json<User>(r)),

  updateUser: (body: Partial<User>) =>
    fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json<User>(r)),

  getTransactions: (params?: { type?: string; search?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set("type", params.type);
    if (params?.search) q.set("search", params.search);
    if (params?.limit) q.set("limit", String(params.limit));
    return fetch(`/api/transactions?${q}`).then((r) => json<Transaction[]>(r));
  },

  createTransaction: (body: TransactionPayload) =>
    fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => json<{ transaction: Transaction; newBalance: number }>(r)),

  getContacts: () => fetch("/api/contacts").then((r) => json<Contact[]>(r)),

  createContact: (body: { name: string; upiId: string; bank?: string }) =>
    fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json<Contact>(r)),

  deleteContact: (id: string) =>
    fetch(`/api/contacts/${id}`, { method: "DELETE" }).then((r) => json<{ success: boolean }>(r)),

  updateContact: (id: string, body: { lastPaid?: string; amount?: number }) =>
    fetch(`/api/contacts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json<Contact>(r)),

  getNotifications: () => fetch("/api/notifications").then((r) => json<Notification[]>(r)),

  markAllNotificationsRead: () =>
    fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) }).then((r) => json<Notification[]>(r)),

  markNotificationRead: (id: string) =>
    fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then((r) => json<Notification>(r)),

  getRiskScore: (body: RiskPayload) =>
    fetch("/api/risk-score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => json<{ riskScore: number; level: string; reasons: string[]; flagged: boolean; reason: string }>(r)),

  login: (email: string, password: string) =>
    fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
      .then((r) => json<{ success: boolean; user?: User; error?: string }>(r)),
};
