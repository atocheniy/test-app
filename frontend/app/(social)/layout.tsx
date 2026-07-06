import BottomPanel from "@/components/BottomPanel";
import RightSidebar from "@/components/Right_Sidebar";
import Sidebar from "@/components/Sidebar";

export default function HomeLayout({
     children 
}: { children: React.ReactNode }) {
  return (
    <div className="h-dvh w-full flex justify-center overflow-hidden w-full">
      <div className="w-full max-w-[1500px] flex h-full">
        
        <Sidebar />
        
        <main className="w-full my-0 h-full lg:my-3 lg:h-[calc(100vh-1.5rem)] border border-white/5 lg:rounded-3xl md:rounded-3xl overflow-y-auto custom-scrollbar relative max-sm:pb-14">
          <div className="text-zinc-100 min-h-full">
            {children}
          </div>
        </main>
        
        <RightSidebar />

        <BottomPanel />
        
      </div>
    </div>
  );
}