// Supabase Edge Function — invoke via:
//   supabase functions invoke send-notifications --body '{"type":"evening"}'
// Schedule with pg_cron (see supabase/cron.sql) or Supabase Dashboard → Scheduled Functions.
//
// Environment variables required (set in Supabase Dashboard → Settings → Edge Functions):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected by runtime)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushBatch, PushMessage } from '../_shared/expo-push.ts';

type NotifType = 'evening' | 'saved_reminder' | 'weekly_nudge';

interface RequestBody {
  type: NotifType;
}

interface UserRow {
  id: string;
  push_token: string;
  saves_count: number;
  checkins_count: number;
}

const MESSAGES: Record<NotifType, (u: UserRow) => { title: string; body: string; data: Record<string, unknown> }> = {
  evening: () => ({
    title: '🔥 Tonight in Hauz Khas Village',
    body: 'Places are buzzing. Swipe to see what\'s on tonight.',
    data: { screen: 'feed' },
  }),
  saved_reminder: (u) => ({
    title: '📍 Your saved spots are calling',
    body: `You have ${u.saves_count} saved place${u.saves_count !== 1 ? 's' : ''}. Tonight's a good night.`,
    data: { screen: 'saved' },
  }),
  weekly_nudge: () => ({
    title: '🌃 HKV is waiting',
    body: 'You haven\'t checked in this week. New spots just opened.',
    data: { screen: 'feed' },
  }),
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { type } = body;
  if (!type || !['evening', 'saved_reminder', 'weekly_nudge'].includes(type)) {
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Fetch eligible users — those with a push token
  let query = supabase
    .from('users')
    .select('id, push_token, saves_count, checkins_count')
    .not('push_token', 'is', null);

  // For weekly_nudge, only target users who haven't checked in in 7+ days
  if (type === 'weekly_nudge') {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentCheckins } = await supabase
      .from('checkins')
      .select('user_id')
      .gte('checked_in_at', sevenDaysAgo);
    const activeUserIds = new Set((recentCheckins ?? []).map((r: { user_id: string }) => r.user_id));
    if (activeUserIds.size > 0) {
      query = query.not('id', 'in', `(${[...activeUserIds].join(',')})`);
    }
  }

  // For saved_reminder, only target users who have at least one save
  if (type === 'saved_reminder') {
    query = query.gt('saves_count', 0);
  }

  const { data: users, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!users || users.length === 0) {
    return new Response(JSON.stringify({ sent: 0, skipped: 'no eligible users' }), { status: 200 });
  }

  const messages: PushMessage[] = (users as UserRow[])
    .filter((u) => u.push_token?.startsWith('ExponentPushToken'))
    .map((u) => {
      const content = MESSAGES[type](u);
      return {
        to: u.push_token,
        title: content.title,
        body: content.body,
        data: content.data,
        sound: 'default',
        channelId: 'default',
      };
    });

  if (messages.length === 0) {
    return new Response(JSON.stringify({ sent: 0, skipped: 'no valid push tokens' }), { status: 200 });
  }

  const receipts = await sendPushBatch(messages);
  const ok = receipts.filter((r) => r.status === 'ok').length;
  const failed = receipts.filter((r) => r.status === 'error').length;

  return new Response(
    JSON.stringify({ sent: ok, failed, total: messages.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
