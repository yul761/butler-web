// Demo data for the Now-page screenshot. run.sh copies this file into the Butler repo as e2e/zz-web-demo-data.ts,
// so the import paths below are relative to Butler's e2e/ directory. Everything here is made up: fictional
// tickets (CART-*, PAY-*), a fictional epic and features. Only the screenshot uses it; it never enters Butler.
import type { SessionActivity, ActivityKind } from "../src/shared/activity";
import type { NowCounts, NowEpic, NowFeature, NowRow, NowView, UsageSummary, WatchedPr } from "../src/shared/types";

export type Lang = "zh" | "en";

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

/** Names shared by the spec (which creates them through real IPC) and the stubbed now:view. */
export const DEMO = {
  epic: { zh: "结账改版", en: "Checkout revamp" },
  features: [
    { name: { zh: "优惠券", en: "Coupons" }, tickets: [
      { key: "CART-12", repo: "backend", title: { zh: "优惠券接口", en: "Coupon endpoint" } },
      { key: "CART-13", repo: "frontend", title: { zh: "购物车显示折扣", en: "Cart discount" } },
      { key: "CART-14", repo: "frontend", title: { zh: "优惠券输入框", en: "Coupon input" } },
      { key: "CART-15", repo: "backend", title: { zh: "优惠券过期规则", en: "Coupon expiry" } },
    ] },
    { name: { zh: "支付方式", en: "Payment methods" }, tickets: [
      { key: "PAY-3", repo: "backend", title: { zh: "保存的银行卡", en: "Saved cards" } },
      { key: "PAY-4", repo: "frontend", title: { zh: "支付方式选择", en: "Method picker" } },
      { key: "PAY-6", repo: "backend", title: { zh: "退款回调", en: "Refund webhook" } },
    ] },
  ],
} as const;

const QUESTION = { zh: "折扣为 0 时，这一行还要显示吗？", en: "Should the discount row show when it's 0?" };
/** Butler main's fixed text for a session stopped on a permission prompt (src/main/strings.ts nowApproval). */
const APPROVAL = { zh: "在终端里确认", en: "confirm in the terminal" };

function act(sessionId: string, kind: ActivityKind, detail: string | null, startedAt: number): SessionActivity {
  return { sessionId, kind, detail, background: false, startedAt, lastOutputAt: startedAt, stuck: false, reason: null, action: null, lastOutput: [] };
}

function pr(ticketKey: string, repo: string, number: number, ci: WatchedPr["ci"], review: WatchedPr["review"], now: number): WatchedPr {
  return { ticketKey, repoId: 0, repoPath: `shop/${repo}`, branch: ticketKey.toLowerCase(), number, url: null, state: "open", review, ci, headSha: null, checkedAt: now };
}

function counts(rows: NowRow[]): NowCounts {
  return {
    active: rows.filter((r) => !r.idle).length,
    needsYou: rows.filter((r) => r.needsYou !== null).length,
    stuck: rows.filter((r) => r.activity?.stuck === true).length,
  };
}

/**
 * One epic, two features, eight rows: two that need you (a question, a permission prompt), editing, testing,
 * watching CI, thinking, a PR waiting to merge, and one idle session.
 */
export function demoNowView(ids: { epicId: number; featureIds: number[] }, now: number, lang: Lang): NowView {
  const [coupons, payments] = DEMO.features;
  const t = (f: (typeof DEMO.features)[number], key: string) => {
    const d = f.tickets.find((x) => x.key === key)!;
    return { ticketKey: d.key, title: d.title[lang] };
  };
  const row = (o: Partial<NowRow> & Pick<NowRow, "sessionId" | "target">): NowRow => ({
    ticketKey: null, title: null, repo: null, coordinator: false, activity: null, mergeQueued: false,
    needsYou: null, refreshing: null, prs: [], idle: false, since: null, ...o,
  });
  const ticketRow = (f: (typeof DEMO.features)[number], key: string, sid: string, o: Partial<NowRow>): NowRow =>
    row({ ...t(f, key), sessionId: sid, target: { page: "ticket", key, sessionId: sid }, ...o });

  const s = (m: number) => now - m * MIN;
  const couponRows: NowRow[] = [
    row({ sessionId: "demo-coord", coordinator: true, target: { page: "feature", id: ids.featureIds[0], sessionId: "demo-coord" },
      activity: act("demo-coord", "thinking", null, s(1)), since: s(1) }),
    ticketRow(coupons, "CART-12", "demo-c12", { activity: act("demo-c12", "edit", "src/cart/coupon.ts", s(4)), since: s(4) }),
    ticketRow(coupons, "CART-13", "demo-c13", { activity: act("demo-c13", "waiting", null, s(6)), needsYou: QUESTION[lang], since: s(6) }),
    ticketRow(coupons, "CART-14", "demo-c14", { activity: act("demo-c14", "test", "pnpm test cart", s(2)), since: s(2),
      prs: [pr("CART-14", "frontend", 482, "pending", "pending", now)] }),
    ticketRow(coupons, "CART-15", "demo-c15", { activity: act("demo-c15", "idle", null, s(48)), idle: true, since: s(48) }),
  ];
  const paymentRows: NowRow[] = [
    ticketRow(payments, "PAY-3", "demo-p3", { activity: act("demo-p3", "ci", "gh pr checks 471 --watch", s(7)), since: s(7),
      prs: [pr("PAY-3", "backend", 471, "pending", "pending", now)] }),
    ticketRow(payments, "PAY-4", "demo-p4", { activity: act("demo-p4", "approval", null, s(12)), needsYou: APPROVAL[lang], since: s(12) }),
    row({ ...t(payments, "PAY-6"), sessionId: null, target: { page: "ticket", key: "PAY-6", sessionId: null },
      prs: [pr("PAY-6", "backend", 468, "passing", "approved", now)] }),
  ];
  const features: NowFeature[] = [
    { id: ids.featureIds[0], name: coupons.name[lang], rows: couponRows, counts: counts(couponRows) },
    { id: ids.featureIds[1], name: payments.name[lang], rows: paymentRows, counts: counts(paymentRows) },
  ];
  const all = [...couponRows, ...paymentRows];
  const epic: NowEpic = { id: ids.epicId, name: DEMO.epic[lang], rows: [], features, counts: counts(all) };
  const needsYou = all.filter((r) => r.needsYou !== null).sort((a, b) => (a.since ?? 0) - (b.since ?? 0));
  return { needsYou, epics: [epic], running: all.filter((r) => r.sessionId !== null).length, merges: [] };
}

/**
 * A plausible week. The page's #usage section quotes these same numbers, so change both together.
 * byKind and byModel are cost-weighted shares (USAGE_WEIGHTS in Butler's usage-summary.ts) and each sum to 1.
 */
export function demoUsage(now: number): UsageSummary {
  return {
    sinceMs: now - 7 * DAY,
    totalTokens: 412_600_000,
    cacheReadShare: 0.58,
    over200kShare: 0.11,
    byKind: { ticket: 0.62, coordinator: 0.17, subagent: 0.15, headless: 0.06 },
    byModel: { "claude-opus-5-5": 0.81, "claude-sonnet-5-5": 0.16, "claude-haiku-5-5": 0.03 },
  };
}
