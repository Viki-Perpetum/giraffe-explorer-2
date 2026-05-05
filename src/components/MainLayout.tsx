import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 p-6 lg:p-8 lg:pl-8 overflow-auto scroll-smooth">
        <Breadcrumbs />
        <Outlet />
      </main>
    </div>
  );
}
