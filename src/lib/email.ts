import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationCodeEmail(newUserEmail: string, newUserName: string, code: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("Falta la variable de entorno ADMIN_EMAIL, no se pudo enviar el correo de verificación.");
    return;
  }

  await resend.emails.send({
    from: "Iskra <onboarding@resend.dev>",
    to: adminEmail,
    subject: `Nuevo registro: ${newUserName}`,
    html: `
      <p>Alguien se registró en Iskra:</p>
      <p><strong>Nombre:</strong> ${newUserName}<br/>
      <strong>Correo:</strong> ${newUserEmail}</p>
      <p>Código de verificación:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
    `,
  });
}
