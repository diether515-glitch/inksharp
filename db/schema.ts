import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// One row per appointment request sent through the "Schedule an Appointment" form.
export const appointments = pgTable("appointments", {
  id: serial().primaryKey(),
  submissionId: text("submission_id").unique(),
  fullName: text("full_name").notNull(),
  contact: text().notNull(),
  tattooType: text("tattoo_type").notNull().default(""),
  ideaDescription: text("idea_description").notNull().default(""),
  preferredArtist: text("preferred_artist").notNull().default(""),
  preferredDate: text("preferred_date").notNull().default(""),
  // new | confirmed | done | cancelled
  status: text().notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
