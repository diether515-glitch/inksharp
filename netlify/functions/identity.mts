// Only the three studio artists can create an account for the Appointments page.
import type { UserValidateEvent } from "@netlify/functions";
import { isStaffEmail } from "../../lib/staff.js";

export default {
  userValidate(event: UserValidateEvent) {
    if (!isStaffEmail(event.user.email)) return event.deny();
  },
};
