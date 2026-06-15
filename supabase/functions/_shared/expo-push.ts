const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

export interface PushReceipt {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

export async function sendPushBatch(messages: PushMessage[]): Promise<PushReceipt[]> {
  const results: PushReceipt[] = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      // Mark whole batch as error rather than throwing
      results.push(
        ...batch.map(() => ({
          status: 'error' as const,
          message: `HTTP ${res.status}`,
        }))
      );
      continue;
    }

    const json = await res.json();
    results.push(...(json.data ?? []));
  }

  return results;
}
