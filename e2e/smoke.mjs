/**
 * Read-only pre-demo smoke test — drives the real app in Chrome via Playwright.
 * Verifies auth, role-based access (Manager / Engineer / Client) and that every
 * key page renders. Makes NO database writes, so it's safe to run anytime.
 *
 *   1. start the app:  npm run dev   (or npm start)
 *   2. run:            E2E_BASE=http://localhost:3000 npm run test:e2e
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE || "http://localhost:3000";
const SHOTS = process.env.E2E_SHOTS; // optional dir for screenshots
const results = [];
const check = (name, cond) => {
  results.push(!!cond);
  console.log(`${cond ? "✓" : "✗ FAIL"}  ${name}`);
};
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
};

async function signIn(browser, email, pw) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 980 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', pw);
  await Promise.all([page.waitForURL("**/dashboard", { timeout: 30000 }), page.click('button[type="submit"]')]);
  return { ctx, page };
}
async function pathAfter(page, to) {
  await page.goto(`${BASE}${to}`, { waitUntil: "domcontentloaded" });
  return new URL(page.url()).pathname;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  // public
  const pub = await (await browser.newContext()).newPage();
  await pub.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  check("Landing loads (public)", (await pub.textContent("body")).includes("Anthem Biosciences"));
  await shot(pub, "qa-landing");
  check("Unauthenticated → /login", (await pathAfter(pub, "/dashboard")) === "/login");

  // viewer / client
  const v = await signIn(browser, "viewer@aapaavani.com", "viewer123");
  check("Client signs in", true);
  check("Client blocked from /manage", (await pathAfter(v.page, "/manage")) === "/dashboard");
  check("Client blocked from /my-tasks", (await pathAfter(v.page, "/my-tasks")) === "/dashboard");
  check(
    "Client sign-off hub renders",
    (await pathAfter(v.page, "/alerts")) === "/alerts" &&
      (await v.page.textContent("body")).includes("Your sign-off"),
  );
  await v.ctx.close();

  // editor / engineer (Rahul Karkera · Design department)
  const e = await signIn(browser, "editor@aapaavani.com", "editor123");
  check("Engineer can open /my-tasks", (await pathAfter(e.page, "/my-tasks")) === "/my-tasks");
  check("Engineer blocked from /manage", (await pathAfter(e.page, "/manage")) === "/dashboard");
  // department-scoped RBAC: an engineer can't write to a task outside their dept (negative, no write)
  const snap = await (await e.page.request.get(`${BASE}/api/snapshot`)).json().catch(() => null);
  let outId = null;
  for (const ph of snap?.phases ?? [])
    for (const t of ph.tasks)
      if (t.type === "T" && t.role !== "DES" && t.owner !== "Rahul Karkera" && outId == null) outId = t.id;
  if (outId != null) {
    const res = await e.page.request.patch(`${BASE}/api/tasks/${outId}`, {
      data: { pct: 50 },
      headers: { "content-type": "application/json" },
    });
    check("Engineer blocked from out-of-dept task write (403)", res.status() === 403);
  } else {
    check("found an out-of-dept task to test", false);
  }
  // engineers can't record client sign-off (negative, no write)
  const apRes = await e.page.request.post(`${BASE}/api/tasks/9/approval`, {
    data: { approval: "APPROVED" },
    headers: { "content-type": "application/json" },
  });
  check("Engineer blocked from client sign-off (403)", apRes.status() === 403);
  await e.ctx.close();

  // admin / manager
  const a = await signIn(browser, "admin@aapaavani.com", "anthem123");
  await shot(a.page, "qa-dashboard");
  check("Manager can open /manage", (await pathAfter(a.page, "/manage")) === "/manage");
  {
    const body = await a.page.textContent("body");
    check("Manage shows all panels", ["Phases & plan", "Tasks & assignments", "Onboard team", "Designation", "Access", "Project settings"].every((t) => body.includes(t)));
  }
  await shot(a.page, "qa-manage");
  for (const id of ["plan", "timeline", "team", "activity"]) {
    await a.page.goto(`${BASE}/dashboard#${id}`, { waitUntil: "domcontentloaded" });
    check(`Dashboard #${id} renders`, (await a.page.locator(`#${id}`).count()) > 0);
  }
  check("Task profile renders", (await pathAfter(a.page, "/task/8")) === "/task/8");
  await shot(a.page, "qa-task");
  // phase detail page
  check(
    "Phase detail renders",
    (await pathAfter(a.page, "/phase/PH-01")) === "/phase/PH-01" &&
      (await a.page.textContent("body")).includes("Phase plan"),
  );
  await shot(a.page, "qa-phase");
  // who's-on-what assignments board
  check(
    "Assignments board renders",
    (await pathAfter(a.page, "/assignments")) === "/assignments" &&
      (await a.page.textContent("body")).includes("on what"),
  );
  await shot(a.page, "qa-assignments");
  // new features
  check("Alerts page renders", (await pathAfter(a.page, "/alerts")) === "/alerts" && (await a.page.textContent("body")).toLowerCase().includes("attention"));
  await shot(a.page, "qa-alerts");
  check("Report page renders", (await pathAfter(a.page, "/report")) === "/report" && (await a.page.textContent("body")).toLowerCase().includes("all tasks"));
  await shot(a.page, "qa-report");
  check("Account page renders", (await pathAfter(a.page, "/account")) === "/account" && (await a.page.textContent("body")).toLowerCase().includes("password"));
  await shot(a.page, "qa-account");
  const csv = await a.page.request.get(`${BASE}/api/export/tasks`);
  check("CSV export downloads", csv.ok() && (csv.headers()["content-type"] || "").toLowerCase().includes("csv"));
  // AI assistant: history endpoint authed + launcher present
  check("Assistant history endpoint (200)", (await a.page.request.get(`${BASE}/api/chat`)).status() === 200);
  await a.page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  check("Assistant launcher present", (await a.page.locator('button[aria-label="Open assistant"]').count()) === 1);
  await a.ctx.close();
} catch (err) {
  check(`No exception (${err.message})`, false);
} finally {
  await browser.close();
}

const passed = results.filter(Boolean).length;
console.log(`\n==== ${passed}/${results.length} checks passed ====`);
process.exitCode = passed === results.length ? 0 : 1;
