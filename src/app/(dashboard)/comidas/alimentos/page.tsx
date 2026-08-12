import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { parseStoredIngredients } from "@/lib/meal-ingredients";
import { SavedMealList } from "@/components/saved-meal-list";

export default async function AlimentosPage() {
  const { userId } = await verifySession();
  const savedMeals = await prisma.savedMeal.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/comidas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" />
          Comidas
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Mis alimentos</h1>
        <p className="text-sm text-muted">Comidas que guardaste para volver a registrarlas rápido.</p>
      </div>

      <SavedMealList
        meals={savedMeals.map((meal) => ({
          id: meal.id,
          title: meal.title,
          calories: meal.calories,
          proteinG: meal.proteinG,
          carbsG: meal.carbsG,
          fatG: meal.fatG,
          ingredients: parseStoredIngredients(meal.ingredients),
        }))}
      />
    </div>
  );
}
