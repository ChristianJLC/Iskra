import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { getWaterStats } from "@/lib/water";
import { WaterStatsView } from "@/components/water-stats";

export default async function AguaPage() {
  const { userId } = await verifySession();
  const initialStats = await getWaterStats(userId, "week", 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/comidas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" />
          Comidas
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Agua</h1>
      </div>

      <WaterStatsView initialStats={initialStats} />
    </div>
  );
}
