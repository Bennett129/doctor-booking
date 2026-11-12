import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { CLINIC } from "./clinic";

export async function sendEmail(message: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<void> {
  const { to, subject, react } = message;
  const html = await render(react);
  const text = await render(react, { plainText: true });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Local development without a Resend key: show the email in the server console.
    console.log(
      `\n----- EMAIL (not sent: RESEND_API_KEY is not set) -----\nTo: ${to}\nSubject: ${subject}\n\n${text}\n-------------------------------------------------------\n`,
    );
    return;
  }

  const from =
    process.env.EMAIL_FROM || `${CLINIC.name} <onboarding@resend.dev>`;
  const { error } = await new Resend(apiKey).emails.send({
    from,
    to,
    subject,
    html,
    text,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
