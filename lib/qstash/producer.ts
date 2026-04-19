import { qstashClient } from "./client";

export interface TransactionEventPayload {
  id: string;
  userId: string;
  amount: number;
  recipientUpi: string;
  recipientName: string;
  status: string;
  riskScore: number;
  trustCheckFlagged: boolean;
  timestamp: string;
  type: string;
}

export async function publishTransactionEvent(data: TransactionEventPayload): Promise<void> {
  if (!qstashClient) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const endpoint = `${appUrl}/api/qstash/transaction-event`;

  try {
    await qstashClient.publishJSON({ url: endpoint, body: data });
  } catch (e) {
    console.error("[QStash] Failed to publish event:", e);
  }
}
