import Image from "next/image";
import { getAvatarSrc } from "@/lib/avatars";
import { cn } from "@/lib/cn";

export function UserAvatar({
  avatarId,
  size = 32,
  className,
}: {
  avatarId: string | null;
  size?: number;
  className?: string;
}) {
  const src = getAvatarSrc(avatarId);

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-xl border border-border object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 rounded-xl border border-border bg-gradient-to-br from-accent to-accent-2 shadow-glow",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
