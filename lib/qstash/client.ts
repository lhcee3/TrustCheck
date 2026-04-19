import { Client } from "@upstash/qstash";

if (!process.env.QSTASH_TOKEN) {
  console.warn("[QStash] QSTASH_TOKEN is not set — events will be skipped.");
}

export const qstashClient = process.env.QSTASH_TOKEN
  ? new Client({ token: process.env.QSTASH_TOKEN })
  : null;
