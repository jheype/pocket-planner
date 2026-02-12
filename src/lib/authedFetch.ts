import { getStoredToken } from "@/components/AppGate";

export async function authedFetch(input: RequestInfo, init?: RequestInit) {
  const token = getStoredToken();
  const headers = new Headers(init?.headers);

  if (token) headers.set("x-app-token", token);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers, cache: "no-store" });
}
