import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/shared/Navbar";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "customer") redirect("/expert");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userName={session.name} userRole="customer" />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">{children}</main>
    </div>
  );
}