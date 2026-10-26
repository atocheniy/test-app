import RightSidebar from "@/components/Right_Sidebar";
import Sidebar from "@/components/Sidebar";

export default function AuthLayout({
     children 
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-row justify-center items-center w-full">
      {children}
    </div>
  );
}