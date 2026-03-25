"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavbarProps {
  userName: string;
  userRole: "customer" | "expert";
  userDomain?: string;
}

export function Navbar({ userName, userRole, userDomain }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-900 tracking-tight">R&P Platform</span>
          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">POC</span>
          <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium capitalize">{userRole} View</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-800">{userName}</div>
            {userDomain && <div className="text-xs text-slate-500">{userDomain}</div>}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}