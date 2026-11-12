// The only people who can sign in to the private Appointments page.
// Booking emails are also sent to these addresses.
export const STAFF_EMAILS = [
  "diether515@gmail.com", // Diether
  "manlor30@gmail.com", // Lorman
  "johnlloydtallada@gmail.com", // John
];

export const isStaffEmail = (email?: string | null) =>
  !!email && STAFF_EMAILS.includes(email.trim().toLowerCase());
