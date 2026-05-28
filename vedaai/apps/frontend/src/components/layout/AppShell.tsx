import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Toaster } from "@/components/ui/use-toast";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">{children}</main>
      <MobileNav />
      <Toaster />
    </div>
  );
}