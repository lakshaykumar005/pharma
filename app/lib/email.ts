import "server-only";
import { prisma } from "./db";

/* Email notifications. Real sending happens only when RESEND_API_KEY is set
   (Resend — https://resend.com). Without it, this is a safe no-op that logs,
   so the app works fully whether or not email is configured. */

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM || process.env.EMAIL_FROM || "Anthem Command Center <onboarding@resend.dev>";
  if (!key) {
    console.log(`[email skipped — set RESEND_API_KEY to enable] → ${to}: ${subject}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Best-effort: email the assignee (if they have a user account) about a task. */
export async function notifyAssignment(ownerName: string, taskDesc: string): Promise<void> {
  try {
    if (!ownerName || ownerName === "Unassigned") return;
    const user = await prisma.user.findFirst({ where: { name: ownerName } });
    if (!user) return;
    await sendEmail(
      user.email,
      `New task assigned: ${taskDesc}`,
      `<p>Hi ${user.name},</p><p>You've been assigned a task on the Anthem Biosciences command center:</p>` +
        `<p><strong>${taskDesc}</strong></p><p>Sign in to view the details and update progress.</p>`,
    );
  } catch {
    // never let notification failures affect the main action
  }
}
