import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/session";
import { LoginFormSchema } from "@/lib/definitions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validatedFields = LoginFormSchema.safeParse(body);

  if (!validatedFields.success) {
    return Response.json(
      { error: "Datos inválidos", details: validatedFields.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = validatedFields.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return Response.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return Response.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  const { token, expiresAt } = await createToken(user.id);

  return Response.json({
    token,
    expiresAt: expiresAt.toISOString(),
    user: { id: user.id, name: user.name, email: user.email },
  });
}
