import Link from "next/link";
import { readAuthLog } from "@/lib/authLog";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "medium",
});

export default async function LogsPage() {
  const entries = await readAuthLog();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black tracking-tight">Journal de sécurité</h1>
          <p className="text-xs text-muted">
            Historique des connexions ({entries.length} entrées, plus récentes en premier)
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border-2 border-line bg-card px-3 py-1.5 text-xs font-bold hover:bg-card-2"
        >
          ← Dashboard
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-line-soft p-8 text-center text-sm text-muted">
          Aucune connexion enregistrée pour l&apos;instant.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-line font-mono text-[10px] uppercase tracking-wider text-muted">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Utilisateur</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Statut</th>
                <th className="hidden px-3 py-2 md:table-cell">Détail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b border-line-soft last:border-b-0">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs tabular-nums">
                    {fmt.format(new Date(e.ts))}
                  </td>
                  <td className="px-3 py-2 font-semibold">{e.user}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.ip}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        e.success
                          ? "border-line bg-accent/20 text-foreground"
                          : "border-danger/50 bg-danger/10 text-danger"
                      }`}
                    >
                      {e.success ? "OK" : "Échec"}
                    </span>
                  </td>
                  <td
                    className="hidden max-w-64 truncate px-3 py-2 text-xs text-muted md:table-cell"
                    title={e.userAgent}
                  >
                    {e.detail ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
