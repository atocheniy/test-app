export function PostSkeleton() {
  return (
    <div className="py-6 border-b border-white/5 space-y-4 animate-pulse">
      
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-zinc-800 rounded-full"></div>
        
        <div className="space-y-2">
          <div className="h-3 w-28 bg-zinc-800 rounded"></div>
          <div className="h-2.5 w-16 bg-zinc-800 rounded"></div>
        </div>
      </div>
      
      <div className="space-y-2.5">
        <div className="h-3 w-full bg-zinc-800 rounded"></div>
        <div className="h-3 w-[92%] bg-zinc-800 rounded"></div>
        <div className="h-3 w-[40%] bg-zinc-800 rounded"></div>
      </div>

      <div className="h-44 w-full bg-zinc-800 rounded-2xl"></div>
      
    </div>
  );
}

export default function FeedSkeleton() {
  return (
    <div className="space-y-1">
      <div className="h-6 w-24 bg-zinc-800 rounded mb-6 animate-pulse"></div>
      
      <PostSkeleton />
      <PostSkeleton />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="relative">
        <div className="h-40 w-full bg-zinc-800 rounded-2xl"></div>
        <div className="absolute -bottom-10 left-4 w-24 h-24 bg-[#0a0a0a] rounded-full p-1">
          <div className="w-full h-full bg-zinc-800 rounded-full"></div>
        </div>
      </div>

      <div className="pt-8 px-4 space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-44 bg-zinc-800 rounded"></div>
          <div className="h-3.5 w-24 bg-zinc-800 rounded"></div>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-80 bg-zinc-800 rounded"></div>
          <div className="h-3 w-60 bg-zinc-800 rounded"></div>
        </div>

        <div className="flex space-x-6 pt-2">
          <div className="h-4 w-20 bg-zinc-800 rounded"></div>
          <div className="h-4 w-20 bg-zinc-800 rounded"></div>
        </div>
      </div>

      <div className="border-b border-white/5 h-10 w-full flex space-x-8 px-4">
        <div className="h-4 w-16 bg-zinc-800 rounded mt-3"></div>
        <div className="h-4 w-16 bg-zinc-800 rounded mt-3"></div>
      </div>

      <div className="px-4">
        <PostSkeleton />
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-full bg-zinc-800 rounded-full"></div>

      <div className="space-y-4">
        <div className="h-4 w-36 bg-zinc-800 rounded mb-4"></div>

        {[1, 2, 3].map((item) => (
          <div key={item} className="flex justify-between items-center py-3 border-b border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-zinc-800 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-3 w-28 bg-zinc-800 rounded"></div>
                <div className="h-2.5 w-16 bg-zinc-800 rounded"></div>
              </div>
            </div>
            <div className="h-8 w-20 bg-zinc-800 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2 mb-8">
        <div className="h-7 w-48 bg-zinc-800 rounded"></div>
        <div className="h-4.5 w-80 bg-zinc-800 rounded"></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((card) => (
          <div key={card} className="h-28 bg-zinc-800/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <div className="h-5 w-24 bg-zinc-800 rounded"></div>
            <div className="h-3 w-full bg-zinc-800 rounded"></div>
          </div>
        ))}
      </div>

      <div className="pt-6">
        <div className="h-4 w-32 bg-zinc-800 rounded mb-4"></div>
        <PostSkeleton />
      </div>
    </div>
  );
}