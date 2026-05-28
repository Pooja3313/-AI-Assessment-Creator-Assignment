"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Plus, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/assignments", label: "Assignments", icon: FileText },
  { href: "/assignments/create", label: "Create", icon: Plus },
  { href: "#", label: "Templates", icon: BookOpen, disabled: true },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = (item.href === "/assignments" && pathname.startsWith("/assignments") && !pathname.includes("/create")) || (item.href === "/assignments/create" && pathname.includes("/create"));
          return (
            <Link key={item.label} href={item.disabled ? "#" : item.href}
              className={cn("flex flex-col items-center justify-center gap-1 px-4 py-2 text-xs font-medium rounded-lg transition-colors",
                active ? "text-black" : "text-gray-500 hover:text-gray-900", item.disabled && "pointer-events-none opacity-50")}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}