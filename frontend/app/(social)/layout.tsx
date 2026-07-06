import RightSidebar from "@/components/Right_Sidebar";
import Sidebar from "@/components/Sidebar";

export default function HomeLayout({
     children 
}: { children: React.ReactNode }) {
  return (
    <div className="h-dvh w-full flex justify-center overflow-hidden w-full">
      <div className="w-full max-w-[1500px] flex h-full">
        
        <Sidebar />
        
        <main className="w-full my-3 h-[calc(100vh-1.5rem)] border border-white/5 rounded-3xl overflow-y-auto custom-scrollbar relative">
          <div className="text-zinc-100 h-full">
            {children}
          </div>
        </main>
        
        <RightSidebar />
        
      </div>
    </div>
  );
}