"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, HelpCircle, Settings, Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/assignments", label: "My Assignments", icon: FileText },
  { href: "#", label: "Templates", icon: BookOpen, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-[280px] flex-col bg-white sticky top-0 h-screen overflow-y-auto flex-shrink-0 border-r border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-7 border-b border-gray-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white font-bold text-lg shadow-sm">V</div>
        <div>
          <div className="text-xl font-bold text-gray-900 tracking-tight">VedaAI</div>
          <div className="text-xs text-gray-500">Assessment Creator</div>
        </div>
      </div>

      <div className="px-4 py-5">
        <Link
          href="/assignments/create"
          className="flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
        >
          <Sparkles className="h-5 w-5" />
          Create Assignment
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 py-2 mb-1">Menu</div>
        {navItems.map((item) => {
          const isActive =
            (item.href === "/assignments" && (pathname === "/assignments" || pathname.startsWith("/assignments/create"))) ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gray-100 text-black border-l-[3px] border-black"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                item.disabled && "pointer-events-none opacity-50"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4 space-y-1">
        <Link
          href="#"
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <HelpCircle className="h-4 w-4" />
          Help & Support
        </Link>

        <div className="rounded-xl bg-gray-50 p-4 mt-3 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-black flex items-center justify-center text-white font-semibold text-sm">MS</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">Ms. Sharma</p>
              <p className="text-xs text-gray-500">Teacher - Class 9-B</p>
            </div>
          </div>
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-700 py-2 px-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all hover:bg-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Link>
        </div>
      </div>
    </aside>
  );
}