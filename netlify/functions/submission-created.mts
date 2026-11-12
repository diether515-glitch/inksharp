// Runs automatically every time a Netlify Form submission is verified.
// 1. Saves a copy of each appointment request in the database.
// 2. Emails it to the three INK SHARP artists.
import nodemailer from "nodemailer";
import { db } from "../../db/index.js";
import { appointments } from "../../db/schema.js";
import { STAFF_EMAILS } from "../../lib/staff.js";

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);

export const handler = async (event: { body?: string | null }) => {
  const { payload } = JSON.parse(event.body || "{}");
  if (!payload || payload.form_name !== "bookingForm") {
    return { statusCode: 200, body: "Ignored" };
  }

  const d = payload.data || {};
  const booking = {
    submissionId: payload.id ? String(payload.id) : null,
    fullName: clean(d.fullName, 60) || "(no name)",
    contact: clean(d.contact, 60),
    tattooType: clean(d.tattooType, 100),
    ideaDescription: clean(d.ideaDescription, 500),
    preferredArtist: clean(d.preferredArtist, 30),
    preferredDate: clean(d.preferredDate, 10),
  };

  // 1. Keep a copy in the database
  try {
    await db.insert(appointments).values(booking).onConflictDoNothing({ target: appointments.submissionId });
  } catch (error) {
    console.error("Could not save appointment to the database", error);
  }

  // 2. Email the artists
  const rows: [string, string][] = [
    ["Name", booking.fullName],
    ["Phone or email", booking.contact],
    ["Tattoo type", booking.tattooType],
    ["Preferred artist", booking.preferredArtist],
    ["Preferred date", booking.preferredDate],
    ["Idea description", booking.ideaDescription || "(none)"],
  ];
  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html =
    `<h2>New appointment request</h2><table cellpadding="6" style="border-collapse:collapse">` +
    rows
      .map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`)
      .join("") +
    `</table>`;
  const subject = `New appointment request: ${booking.fullName} with ${booking.preferredArtist || "any artist"} on ${booking.preferredDate || "TBD"}`;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  // Placeholder mode: until GMAIL_USER and GMAIL_APP_PASSWORD are set, the email is
  // only logged (the request is still saved in the database and under Forms in Netlify).
  if (!user || !pass) {
    console.warn(`[email not configured] Would send to ${STAFF_EMAILS.join(", ")}\n${subject}\n${text}`);
    return { statusCode: 200, body: "Saved; email not configured" };
  }

  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(booking.contact) ? booking.contact : undefined;

  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    await transporter.sendMail({
      from: `"INK SHARP Bookings" <${user}>`,
      to: STAFF_EMAILS.join(", "),
      replyTo,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Could not send booking email", error);
  }

  return { statusCode: 200, body: "Saved" };
};
