type SendPushArgs = {
  appId: string;
  apiKey: string;
  playerIds: string[];
  title: string;
  body: string;
  url?: string;
};

type OneSignalResponse = unknown;

export async function sendPushToPlayers(args: SendPushArgs): Promise<OneSignalResponse> {
  const payload: Record<string, unknown> = {
    app_id: args.appId,
    include_player_ids: args.playerIds,
    headings: { en: args.title },
    contents: { en: args.body },
  };

  if (args.url) payload.url = args.url;

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${args.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`OneSignal request failed: ${res.status} ${text}`);
  }

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}
