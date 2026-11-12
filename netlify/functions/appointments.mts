// Private API for the staff Appointments page. Only signed-in studio artists can use it.
//   GET    /api/appointments          list every saved appointment (newest first)
//   PATCH  /api/appointments/:id      { status } update the status
//   DELETE /api/appointments/:id      remove an appointment (e.g. spam)
import type { Config, Context } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appointments } from "../../db/schema.js";
import { isStaffEmail } from "../../lib/staff.js";

const STATUSES = ["new", "confirmed", "done", "cancelled"];
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export default async (req: Request, context: Context) => {
  const user = await getUser();
  if (!user) return json({ error: "Please sign in." }, 401);
  if (!isStaffEmail(user.email)) return json({ error: "This account does not have access." }, 403);

  if (req.method === "GET") {
    const rows = await db.select().from(appointments).orderBy(desc(appointments.createdAt));
    return json({ appointments: rows });
  }

  // simple same-origin check for changes
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return json({ error: "Forbidden" }, 403);

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id < 1) return json({ error: "Unknown appointment." }, 400);

  if (req.method === "PATCH") {
    const body = await req.json().catch(() => ({}));
    if (!STATUSES.includes(body.status)) return json({ error: "Invalid status." }, 400);
    const [row] = await db.update(appointments).set({ status: body.status }).where(eq(appointments.id, id)).returning();
    return row ? json({ appointment: row }) : json({ error: "Appointment not found." }, 404);
  }

  if (req.method === "DELETE") {
    await db.delete(appointments).where(eq(appointments.id, id));
    return new Response(null, { status: 204 });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config: Config = {
  path: ["/api/appointments", "/api/appointments/:id"],
};
