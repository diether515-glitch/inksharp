/* INK SHARP - staff Appointments page (signed-in artists only) */
import {
  getUser, login, logout, signup, handleAuthCallback, acceptInvite,
  requestPasswordRecovery, updateUser
} from "./vendor/netlify-identity.js";

const $ = (id) => document.getElementById(id);

const pageStatus = $("pageStatus");
const authView = $("authView");
const listView = $("listView");
const signOutBtn = $("signOut");

const authForm = $("authForm");
const authTitle = $("authTitle");
const authHelp = $("authHelp");
const authMessage = $("authMessage");
const authSubmit = $("authSubmit");
const nameField = $("nameField");
const emailField = $("emailField");
const passwordField = $("passwordField");
const authName = $("authName");
const authEmail = $("authEmail");
const authPassword = $("authPassword");
const toSignup = $("toSignup");
const toLogin = $("toLogin");
const toForgot = $("toForgot");

const rowsEl = $("apptRows");
const emptyNote = $("emptyNote");
const listSummary = $("listSummary");
const searchInput = $("search");
const artistFilter = $("artistFilter");
const statusFilter = $("statusFilter");

const STATUS_LABELS = { new: "New", confirmed: "Confirmed", done: "Done", cancelled: "Cancelled" };
const DEFAULT_HELP = authHelp.textContent;

let mode = "login"; // login | signup | forgot | invite | reset
let inviteToken = "";
let allAppointments = [];

/* ---------- sign in / account forms ---------- */
function setMode(next) {
  mode = next;
  authMessage.textContent = "";
  authMessage.className = "auth-message";
  nameField.hidden = next !== "signup";
  emailField.hidden = next === "invite" || next === "reset";
  passwordField.hidden = next === "forgot";
  authPassword.autocomplete = next === "login" ? "current-password" : "new-password";
  toSignup.hidden = next !== "login";
  toLogin.hidden = next === "login";
  toForgot.hidden = next !== "login";

  const copy = {
    login: ["Staff sign in", "Sign in", DEFAULT_HELP],
    signup: ["Create your account", "Create account", "Use your studio email (the one that receives booking emails) and choose a password of at least 8 characters."],
    forgot: ["Reset password", "Send reset link", "Enter your email and we will send you a link to choose a new password."],
    invite: ["Choose a password", "Save password", "Set a password for your staff account."],
    reset: ["Choose a new password", "Save password", "Enter a new password of at least 8 characters."]
  }[next];
  authTitle.textContent = copy[0];
  authSubmit.textContent = copy[1];
  authHelp.textContent = copy[2];
}

function showMessage(text, isError) {
  authMessage.textContent = text;
  authMessage.className = "auth-message " + (isError ? "error" : "ok");
}

function friendlyError(error) {
  const status = error && error.status;
  const msg = String((error && error.message) || "");
  if (status === 401 && mode === "signup") return "This email is not on the studio staff list.";
  if (/confirm/i.test(msg)) return "Please confirm your email first using the link we sent you.";
  if (status === 400 || status === 401 || /invalid/i.test(msg)) return "Wrong email or password.";
  if (/already/i.test(msg)) return "An account with this email already exists. Try signing in.";
  return msg || "Something went wrong. Please try again.";
}

toSignup.addEventListener("click", () => setMode("signup"));
toLogin.addEventListener("click", () => setMode("login"));
toForgot.addEventListener("click", () => setMode("forgot"));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;

  if (!emailField.hidden && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    showMessage("Please enter a valid email address.", true);
    return;
  }
  if (!passwordField.hidden && password.length < 8) {
    showMessage("Password must be at least 8 characters.", true);
    return;
  }

  authSubmit.disabled = true;
  try {
    if (mode === "login") {
      await login(email, password);
      await showList();
    } else if (mode === "signup") {
      await signup(email, password, { full_name: authName.value.trim() });
      if (await getUser()) {
        await showList();
      } else {
        setMode("login");
        showMessage("Account created. Check your inbox and click the confirmation link, then sign in.", false);
      }
    } else if (mode === "forgot") {
      await requestPasswordRecovery(email);
      showMessage("If that email has an account, a reset link is on its way.", false);
    } else if (mode === "invite") {
      await acceptInvite(inviteToken, password);
      await showList();
    } else if (mode === "reset") {
      await updateUser({ password });
      await showList();
    }
  } catch (error) {
    showMessage(friendlyError(error), true);
  } finally {
    authSubmit.disabled = false;
  }
});

signOutBtn.addEventListener("click", async () => {
  await logout().catch(() => {});
  allAppointments = [];
  rowsEl.replaceChildren();
  showAuth("login");
});

function showAuth(nextMode) {
  listView.hidden = true;
  signOutBtn.hidden = true;
  authView.hidden = false;
  pageStatus.textContent = "";
  setMode(nextMode);
}

/* ---------- appointment list ---------- */
async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function showList() {
  authView.hidden = true;
  pageStatus.textContent = "Loading appointments…";
  try {
    const data = await api("/api/appointments");
    allAppointments = data.appointments || [];
  } catch (error) {
    if (error.status === 401) return showAuth("login");
    if (error.status === 403) {
      await logout().catch(() => {});
      showAuth("login");
      showMessage("This account does not have access to the appointments.", true);
      return;
    }
    pageStatus.textContent = "Could not load appointments. Please refresh the page.";
    return;
  }
  pageStatus.textContent = "";
  listView.hidden = false;
  signOutBtn.hidden = false;
  render();
}

function formatReceived(iso) {
  const date = new Date(iso);
  return date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return value || "—";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function filtered() {
  const query = searchInput.value.trim().toLowerCase();
  const artist = artistFilter.value;
  const status = statusFilter.value;
  return allAppointments.filter((a) =>
    (!artist || a.preferredArtist === artist) &&
    (!status || a.status === status) &&
    (!query || [a.fullName, a.contact, a.ideaDescription, a.tattooType].join(" ").toLowerCase().includes(query))
  );
}

function cell(text, className) {
  const td = document.createElement("td");
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

function render() {
  const list = filtered();
  const newCount = allAppointments.filter((a) => a.status === "new").length;
  listSummary.textContent =
    `${list.length} of ${allAppointments.length} appointment${allAppointments.length === 1 ? "" : "s"}` +
    (newCount ? ` · ${newCount} new` : "") +
    ` · as of ${new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}`;

  rowsEl.replaceChildren(...list.map((a) => {
    const tr = document.createElement("tr");
    tr.className = "is-" + a.status;

    const statusTd = document.createElement("td");
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Status for ${a.fullName}`);
    Object.entries(STATUS_LABELS).forEach(([value, label]) => {
      select.add(new Option(label, value, false, value === a.status));
    });
    select.addEventListener("change", () => changeStatus(a, select));
    const printStatus = document.createElement("span");
    printStatus.className = "print-status";
    printStatus.textContent = STATUS_LABELS[a.status] || a.status;
    statusTd.append(select, printStatus);

    const actionTd = document.createElement("td");
    actionTd.className = "no-print";
    const del = document.createElement("button");
    del.type = "button";
    del.className = "row-delete";
    del.textContent = "Delete";
    del.addEventListener("click", () => removeAppointment(a));
    actionTd.append(del);

    tr.append(
      cell(formatReceived(a.createdAt), "nowrap"),
      cell(a.fullName),
      cell(a.contact),
      cell(a.preferredArtist || "—"),
      cell(formatDate(a.preferredDate), "nowrap"),
      cell(a.tattooType || "—"),
      cell(a.ideaDescription || "—", "idea"),
      statusTd,
      actionTd
    );
    return tr;
  }));

  emptyNote.hidden = list.length > 0;
  emptyNote.textContent = allAppointments.length ? "No appointments match these filters." : "No appointment requests yet. New bookings appear here automatically.";
}

async function changeStatus(appointment, select) {
  const previous = appointment.status;
  select.disabled = true;
  try {
    const data = await api(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: select.value })
    });
    Object.assign(appointment, data.appointment);
    render();
  } catch (error) {
    select.value = previous;
    alert("Could not update the status. Please try again.");
  } finally {
    select.disabled = false;
  }
}

async function removeAppointment(appointment) {
  if (!confirm(`Delete the appointment from ${appointment.fullName}? This cannot be undone.`)) return;
  try {
    await api(`/api/appointments/${appointment.id}`, { method: "DELETE" });
    allAppointments = allAppointments.filter((a) => a.id !== appointment.id);
    render();
  } catch (error) {
    alert("Could not delete the appointment. Please try again.");
  }
}

/* ---------- copies: CSV download and print ---------- */
function csvValue(value) {
  const text = String(value ?? "");
  // stop spreadsheet apps from running formulas typed into the form
  const safe = /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}

$("csvBtn").addEventListener("click", () => {
  const header = ["Received", "Client", "Contact", "Artist", "Preferred date", "Tattoo type", "Idea", "Status"];
  const lines = filtered().map((a) => [
    formatReceived(a.createdAt), a.fullName, a.contact, a.preferredArtist, a.preferredDate,
    a.tattooType, a.ideaDescription, STATUS_LABELS[a.status] || a.status
  ].map(csvValue).join(","));
  const csv = "﻿" + [header.map(csvValue).join(","), ...lines].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `inksharp-appointments-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

$("printBtn").addEventListener("click", () => window.print());
$("refreshBtn").addEventListener("click", showList);
[searchInput, artistFilter, statusFilter].forEach((el) => el.addEventListener("input", render));

/* ---------- start ---------- */
async function start() {
  try {
    // finishes email confirmation, password reset and invite links
    const result = await handleAuthCallback();
    if (result && result.type === "invite" && result.token) {
      inviteToken = result.token;
      return showAuth("invite");
    }
    if (result && result.type === "recovery") {
      return showAuth("reset");
    }
  } catch (error) {
    showAuth("login");
    showMessage("That link has expired or was already used. Please try again.", true);
    return;
  }

  const user = await getUser().catch(() => null);
  if (user) {
    await showList();
  } else {
    showAuth("login");
  }
}

start();
