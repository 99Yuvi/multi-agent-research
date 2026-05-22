import { getSession } from "@/lib/auth";
import { ResearchLayout } from "@/components/ResearchLayout";

export default async function Home() {
  const session = await getSession();
  return (
    <ResearchLayout
      username={session?.username ?? ""}
      role={session?.role ?? "user"}
    />
  );
}
