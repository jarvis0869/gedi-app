import PostHog from 'posthog-react-native';

let _client: PostHog | null = null;

function client(): PostHog {
  if (!_client) {
    _client = new PostHog('phc_AY527qs3cbe3cVgWD5LWkDEELZ9h7odw33s5EKdEiCLn', {
      host: 'https://us.i.posthog.com',
      sendFeatureFlagEvent: false,
      preloadFeatureFlags: false,
    });
  }
  return _client;
}

export function track(event: string, props?: Record<string, string | number | boolean | null>) {
  try {
    client().capture(event, props as any);
  } catch {}
}

export function identify(userId: string, traits?: Record<string, string | number | boolean | null>) {
  try {
    client().identify(userId, traits as any);
  } catch {}
}
