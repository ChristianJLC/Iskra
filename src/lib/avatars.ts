export const AVATAR_PRESETS = [
  { id: "avatar-1", src: "/avatars/avatar-1.jpg", label: "Avatar 1" },
  { id: "avatar-2", src: "/avatars/avatar-2.jpg", label: "Avatar 2" },
  { id: "avatar-3", src: "/avatars/avatar-3.jpg", label: "Avatar 3" },
  { id: "avatar-4", src: "/avatars/avatar-4.jpg", label: "Avatar 4" },
  { id: "avatar-5", src: "/avatars/avatar-5.jpg", label: "Avatar 5" },
] as const;

export type AvatarId = (typeof AVATAR_PRESETS)[number]["id"];

export function isValidAvatarId(id: string): id is AvatarId {
  return AVATAR_PRESETS.some((avatar) => avatar.id === id);
}

export function getAvatarSrc(avatarId: string | null): string | null {
  return AVATAR_PRESETS.find((avatar) => avatar.id === avatarId)?.src ?? null;
}
