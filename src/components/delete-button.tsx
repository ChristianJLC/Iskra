import { Trash2 } from "lucide-react";

export function DeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button
        type="submit"
        aria-label="Eliminar"
        className="flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-danger"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}
