import { auth } from "@/server/auth";
import { headers } from "next/headers";

export default async function Page() {
  const data = await auth.api.getSession({ headers: await headers() });
  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">
          Hello, {data?.user?.email || "Guest"}
        </h1>
        hello
      </div>
    </div>
  );
}
