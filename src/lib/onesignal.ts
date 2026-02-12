export async function sendPushToPlayers(args: {
  appId: string;
  apiKey: string;
  playerIds: string[];
  title: string;
  body: string;
}) {
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      Authorization: `Basic ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: args.appId,
      include_player_ids: args.playerIds,
      headings: { en: args.title },
      contents: { en: args.body },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OneSignal error: ${res.status} ${text}`);
  }

  return res.json();
}
