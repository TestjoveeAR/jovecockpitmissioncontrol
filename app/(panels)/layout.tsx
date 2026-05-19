import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default function PanelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
