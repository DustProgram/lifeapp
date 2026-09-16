/**
 * Home Assistant credential check, server-side.
 *
 * Uses HA's `login_flow` API (the same one the official mobile apps use):
 *   1. POST /auth/login_flow            → flow_id
 *   2. POST /auth/login_flow/{flow_id}  → auth code (or MFA step)
 *   3. POST /auth/token                 → access token (proves the code is real)
 *
 * The tokens are discarded: LifeOS only uses HA as an identity provider and
 * issues its own signed session cookie. Configure with HA_URL, e.g.
 * HA_URL=http://homeassistant.local:8123
 */

export type HaLoginResult =
  | { ok: true }
  | { ok: false; reason: "invalid_credentials" | "mfa_required" | "unreachable" | "not_configured" };

export function haConfigured(): boolean {
  return Boolean(process.env.HA_URL);
}

export async function verifyHaCredentials(
  username: string,
  password: string
): Promise<HaLoginResult> {
  const haUrl = process.env.HA_URL?.replace(/\/+$/, "");
  if (!haUrl) return { ok: false, reason: "not_configured" };

  // client_id must be a URL; HA associates issued refresh tokens with it.
  const clientId = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "") + "/";

  try {
    const flowRes = await fetch(`${haUrl}/auth/login_flow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        redirect_uri: clientId,
        handler: ["homeassistant", null],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!flowRes.ok) return { ok: false, reason: "unreachable" };
    const flow = (await flowRes.json()) as { flow_id?: string };
    if (!flow.flow_id) return { ok: false, reason: "unreachable" };

    const stepRes = await fetch(`${haUrl}/auth/login_flow/${flow.flow_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, username, password }),
      signal: AbortSignal.timeout(10000),
    });
    if (!stepRes.ok) return { ok: false, reason: "invalid_credentials" };
    const step = (await stepRes.json()) as {
      type?: string;
      result?: string;
      step_id?: string;
      errors?: Record<string, string>;
    };

    if (step.type === "create_entry" && step.result) {
      // Exchange the code so we know it is genuine, then drop the tokens.
      const tokenRes = await fetch(`${haUrl}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: step.result,
          client_id: clientId,
        }),
        signal: AbortSignal.timeout(10000),
      });
      return tokenRes.ok
        ? { ok: true }
        : { ok: false, reason: "invalid_credentials" };
    }

    if (step.step_id === "mfa") return { ok: false, reason: "mfa_required" };
    return { ok: false, reason: "invalid_credentials" };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}
