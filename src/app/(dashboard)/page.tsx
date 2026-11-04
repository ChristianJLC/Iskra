import { Suspense } from "react";
import { getCurrentUser } from "@/lib/dal";
import { formatDateEs } from "@/lib/date";
import { getResumen } from "@/lib/resumen";
import { ResumenDashboard, ResumenSkeleton } from "@/components/resumen-dashboard";
import { UserAvatar } from "@/components/user-avatar";

async function ResumenContent({ userId, timezone }: { userId: string; timezone: string }) {
  const data = await getResumen(userId, timezone);
  return <ResumenDashboard data={data} />;
}

export default async function ResumenPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="reveal flex items-center gap-3">
        <UserAvatar avatarId={user.avatarId} size={48} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Hola, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted">{formatDateEs(new Date(), user.timezone)}</p>
        </div>
      </div>

      <Suspense fallback={<ResumenSkeleton />}>
        <ResumenContent userId={user.id} timezone={user.timezone} />
      </Suspense>
    </div>
  );
}
