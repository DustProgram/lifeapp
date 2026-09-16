/**
 * Home Assistant credential check, server-side.
 *
 * Two channels, tried in order when running as an add-on:
 *
 * 1. Supervisor auth API (`auth_api: true`): POST http://supervisor/auth —
 *    validates username/password against the HA user database.
 * 2. HA's `login_flow` API (the same one the official mobile apps use),
 *    against HA_URL (defaults to the add-on-internal http://homeassistant:8123):
 *      a. POST /auth/login_flow            → flow_id
 *      b. POST /auth/login_flow/{flow_id}  → auth code (or MFA step)
 *      c. POST /auth/token                 → access token (proves the code is real)
 *
 * The tokens are discarded: LifeOS only uses HA as an identity provider and
 * issues its own signed session cookie. Standalone (non add-on) deployments
 * configure channel 2 with HA_URL, e.g. HA_URL=http://homeassistant.local:8123
 */

export type HaLoginResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid_credentials" | "mfa_required" | "unreachable" | "not_configured";
      /** Diagnostic technique (code HTTP, étape) pour les journaux. */
      detail?: string;
    };

export function haConfigured(): boolean {
  return Boolean(process.env.HA_URL || process.env.SUPERVISOR_TOKEN);
}

/**
 * Add-on mode: when LifeOS runs as a Home Assistant add-on (`auth_api: true`
 * in its config), the Supervisor exposes an auth endpoint that validates a
 * username/password against the HA user database directly.
 */
async function verifySupervisorAuth(
  username: string,
  password: string
): Promise<HaLoginResult> {
  const attempt = async (contentType: string, body: string) => {
    const res = await fetch("http://supervisor/auth", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}`,
        "Content-Type": contentType,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    // Le corps d'erreur du Supervisor est utile au diagnostic (jamais le mdp).
    const text = res.ok ? "" : (await res.text()).slice(0, 200);
    console.log(
      `[lifeos-auth] supervisor /auth (${contentType.split("/")[1]}) -> HTTP ${res.status}${text ? ` : ${text}` : ""}`
    );
    return res;
  };

  try {
    let res = await attempt("application/json", JSON.stringify({ username, password }));
    // Certains Supervisors n'acceptent que le format formulaire : on retente.
    if (!res.ok && res.status !== 401) {
      res = await attempt(
        "application/x-www-form-urlencoded",
        new URLSearchParams({ username, password }).toString()
      );
    }
    if (res.ok) return { ok: true };
    if (res.status === 403) {
      return {
        ok: false,
        reason: "unreachable",
        detail: "supervisor 403 — auth_api refusé (add-on non autorisé)",
      };
    }
    if (res.status >= 500) {
      return { ok: false, reason: "unreachable", detail: `supervisor ${res.status}` };
    }
    return {
      ok: false,
      reason: "invalid_credentials",
      detail: `supervisor ${res.status}`,
    };
  } catch (err) {
    console.log(`[lifeos-auth] supervisor /auth injoignable : ${String(err)}`);
    return { ok: false, reason: "unreachable", detail: "fetch failed" };
  }
}

/** Échange le code d'autorisation contre un token pour prouver qu'il est réel. */
async function exchangeAuthCode(
  haUrl: string,
  clientId: string,
  code: string
): Promise<HaLoginResult> {
  const tokenRes = await fetch(`${haUrl}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
    }),
    signal: AbortSignal.timeout(10000),
  });
  console.log(`[lifeos-auth] login_flow token -> HTTP ${tokenRes.status}`);
  return tokenRes.ok
    ? { ok: true }
    : { ok: false, reason: "invalid_credentials", detail: `token ${tokenRes.status}` };
}

/**
 * Channel 2: HA core login_flow (the official mobile-app login API).
 * `mfaCode` completes the TOTP step for accounts with two-factor auth.
 */
async function verifyLoginFlow(
  username: string,
  password: string,
  mfaCode?: string
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
    console.log(`[lifeos-auth] login_flow init (${haUrl}) -> HTTP ${flowRes.status}`);
    if (!flowRes.ok) {
      return { ok: false, reason: "unreachable", detail: `login_flow init ${flowRes.status}` };
    }
    const flow = (await flowRes.json()) as { flow_id?: string };
    if (!flow.flow_id) {
      return { ok: false, reason: "unreachable", detail: "login_flow: pas de flow_id" };
    }

    const stepRes = await fetch(`${haUrl}/auth/login_flow/${flow.flow_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, username, password }),
      signal: AbortSignal.timeout(10000),
    });
    console.log(`[lifeos-auth] login_flow step -> HTTP ${stepRes.status}`);
    if (!stepRes.ok) {
      return { ok: false, reason: "invalid_credentials", detail: `login_flow ${stepRes.status}` };
    }
    const step = (await stepRes.json()) as {
      type?: string;
      result?: string;
      step_id?: string;
      errors?: Record<string, string>;
    };

    if (step.type === "create_entry" && step.result) {
      return exchangeAuthCode(haUrl, clientId, step.result);
    }

    if (step.step_id === "mfa") {
      if (!mfaCode) return { ok: false, reason: "mfa_required" };
      // Étape TOTP : on soumet le code dans le même flow.
      const mfaRes = await fetch(`${haUrl}/auth/login_flow/${flow.flow_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, code: mfaCode }),
        signal: AbortSignal.timeout(10000),
      });
      console.log(`[lifeos-auth] login_flow mfa -> HTTP ${mfaRes.status}`);
      if (!mfaRes.ok) {
        return { ok: false, reason: "invalid_credentials", detail: `mfa ${mfaRes.status}` };
      }
      const mfaStep = (await mfaRes.json()) as {
        type?: string;
        result?: string;
        errors?: Record<string, string>;
      };
      if (mfaStep.type === "create_entry" && mfaStep.result) {
        return exchangeAuthCode(haUrl, clientId, mfaStep.result);
      }
      console.log(
        `[lifeos-auth] login_flow code MFA refusé : ${JSON.stringify(mfaStep.errors ?? mfaStep.type)}`
      );
      return { ok: false, reason: "invalid_credentials", detail: "code MFA refusé" };
    }
    console.log(
      `[lifeos-auth] login_flow refusé : ${JSON.stringify(step.errors ?? step.step_id ?? step.type)}`
    );
    return { ok: false, reason: "invalid_credentials", detail: "login_flow: identifiants refusés" };
  } catch (err) {
    console.log(`[lifeos-auth] login_flow injoignable : ${String(err)}`);
    return { ok: false, reason: "unreachable", detail: "login_flow fetch failed" };
  }
}

export async function verifyHaCredentials(
  username: string,
  password: string,
  mfaCode?: string
): Promise<HaLoginResult> {
  // Un code MFA ne peut être consommé que par le login_flow.
  if (process.env.SUPERVISOR_TOKEN && !mfaCode) {
    const sup = await verifySupervisorAuth(username, password);
    if (sup.ok) return sup;
    // Canal de secours : le login_flow du cœur HA via le réseau interne.
    console.log("[lifeos-auth] canal Supervisor refusé, bascule sur login_flow");
    const flow = await verifyLoginFlow(username, password);
    if (flow.ok || flow.reason === "mfa_required") return flow;
    // Erreur la plus parlante des deux.
    return flow.reason === "not_configured" || flow.reason === "unreachable" ? sup : flow;
  }
  return verifyLoginFlow(username, password, mfaCode);
}
