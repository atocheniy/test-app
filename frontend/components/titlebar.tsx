export default function Titlebar({ title }: { title: string }) 
{
    return (
        <div className="sticky top-0 z-1000 flex items-center h-16 px-6 border-b border-white/5 bg-black/60 backdrop-blur-sm">
            <h1 className="text-xl font-bold text-zinc-100">{title}</h1>
        </div>
    )
}