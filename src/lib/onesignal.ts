type SendPushArgs = {
  appId: string;
  apiKey: string;
  playerIds: string[];
  title: string;
  body: string;
  url?: string;
};

export async function sendPushToPlayers(args: SendPushArgs) {
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${args.apiKey}`,
    },
    body: JSON.stringify({
      app_id: args.appId,
      include_player_ids: args.playerIds,
      headings: { en: args.title },
      contents: { en: args.body },
      ...(args.url ? { url: args.url } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OneSignal request failed: ${res.status} ${text}`);
  }

  return res.json().catch(() => ({}));
}
