"use server";

import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { sendVerificationCodeEmail } from "@/lib/email";
import { LoginFormSchema, SignupFormSchema, VerifyFormSchema, type FormState } from "@/lib/definitions";

const MAX_VERIFICATION_ATTEMPTS = 10;

function generateVerificationCode() {
  return String(randomInt(100000, 1000000));
}

export async function signup(_state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { errors: { email: ["Ya existe una cuenta con este correo."] } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const code = generateVerificationCode();

  await prisma.pendingSignup.upsert({
    where: { email },
    create: { name, email, passwordHash, verificationCode: code },
    update: { name, passwordHash, verificationCode: code, verificationCodeAttempts: 0 },
  });

  await sendVerificationCodeEmail(email, name, code);

  redirect(`/verificar?email=${encodeURIComponent(email)}`);
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "Correo o contraseña incorrectos." };
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return { message: "Correo o contraseña incorrectos." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function verifyAccount(_state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = VerifyFormSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, code } = validatedFields.data;

  const pending = await prisma.pendingSignup.findUnique({ where: { email } });
  if (!pending) {
    return { message: "No hay un registro pendiente con este correo." };
  }

  if (pending.verificationCodeAttempts >= MAX_VERIFICATION_ATTEMPTS) {
    return { message: "Demasiados intentos. Contacta al administrador para que te genere un código nuevo." };
  }

  if (pending.verificationCode !== code) {
    await prisma.pendingSignup.update({
      where: { id: pending.id },
      data: { verificationCodeAttempts: { increment: 1 } },
    });
    return { errors: { code: ["Código incorrecto."] } };
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name: pending.name, email: pending.email, passwordHash: pending.passwordHash },
      select: { id: true },
    });
    await tx.pendingSignup.delete({ where: { id: pending.id } });
    return created;
  });

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
