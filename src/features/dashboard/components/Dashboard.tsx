import { DashboardFooter } from "./DashboardFooter";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTimeline } from "./DashboardTimeline";
import { DashboardToolbar } from "./DashboardToolbar";

export function Dashboard() {
  return (
    <div className="dark flex flex-col h-screen text-foreground bg-background overflow-hidden font-sans">
      <DashboardHeader />
      <DashboardToolbar />
      <div className="flex flex-1 overflow-hidden relative">
        <DashboardSidebar />
        <DashboardTimeline />
      </div>
      <DashboardFooter />
    </div>
  );
}
