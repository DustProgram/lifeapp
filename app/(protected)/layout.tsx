import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { getSession } from "@/lib/session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 py-5">{children}</main>
    </div>
  );
}
