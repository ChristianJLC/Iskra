"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { updateName, setAvatar } from "@/actions/profile";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function ProfileForm({
  name,
  avatarId,
}: {
  name: string;
  avatarId: string | null;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarId);
  const [isSavingName, startSavingName] = useTransition();
  const [isSavingAvatar, startSavingAvatar] = useTransition();

  function handleSaveName() {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    startSavingName(async () => {
      await updateName(trimmed);
      setIsEditingName(false);
    });
  }

  function handleSelectAvatar(id: string | null) {
    setSelectedAvatar(id);
    startSavingAvatar(async () => {
      await setAvatar(id);
    });
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <Label className="mb-0">Nombre</Label>
        {isEditingName ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
            <Button type="button" disabled={isSavingName || !nameValue.trim()} onClick={handleSaveName}>
              {isSavingName ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setNameValue(name);
                setIsEditingName(true);
              }}
            >
              Editar
            </Button>
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <Label className="mb-0">Foto de perfil</Label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleSelectAvatar(null)}
            disabled={isSavingAvatar}
            aria-label="Usar predeterminado"
            className={cn(
              "size-16 shrink-0 rounded-xl border border-border bg-gradient-to-br from-accent to-accent-2 transition-opacity disabled:opacity-50",
              selectedAvatar === null && "ring-2 ring-accent ring-offset-2 ring-offset-surface-1"
            )}
          />
          {AVATAR_PRESETS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => handleSelectAvatar(avatar.id)}
              disabled={isSavingAvatar}
              aria-label={avatar.label}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-xl border border-border transition-opacity disabled:opacity-50",
                selectedAvatar === avatar.id && "ring-2 ring-accent ring-offset-2 ring-offset-surface-1"
              )}
            >
              <Image src={avatar.src} alt={avatar.label} fill className="object-cover" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
