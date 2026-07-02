import Post from "@/components/post";
import PublicBlock from "@/components/public_block";
import Titlebar from "@/components/titlebar";

export default function Feed() {

    const post = { Name: "", UserName: "", Content: "", Time: "" };
    const posts = Array.from({ length: 10 }, () => post);

    return (
        <div className="flex flex-col min-h-full">
           
            <Titlebar title="Feed"></Titlebar>
            <PublicBlock></PublicBlock>
            
            <div className="flex flex-col gap-4 p-6">
                {posts.map((p, index) => {
                    return (
                         <Post key={index}  Name={p.Name}  UserName={p.UserName}  Content={p.Content}  Time={p.Time} />
                    );
                })}
            </div>
        </div>
    )
}