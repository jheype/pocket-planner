import { NextResponse } from "next/server";

export function requireAppToken(req: Request) {
  const expected = process.env.APP_TOKEN;
  const got = req.headers.get("x-app-token") ?? "";

  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfigured: APP_TOKEN missing" },
      { status: 500 }
    );
  }

  if (got !== expected) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  return null;
}
