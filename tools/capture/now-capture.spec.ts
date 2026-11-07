// Screenshot of Butler's Now page for butler.statecore.io. run.sh copies this into the Butler repo as
// e2e/zz-web-capture.spec.ts and deletes it afterwards; it is not one of Butler's tests.
// The epic, features and tickets are created through Butler's real IPC; only now:view and usage:summary are
// replaced (in this test's Electron process) with demo data, because live sessions, PRs and CI can't be faked here.
import { join } from "node:path";
import { IPC } from "../src/shared/ipc";
import { S, setUiLang } from "../src/renderer/src/strings";
import { completeWizard, expect, makeGitRepo, test } from "./fixtures";
import { DEMO, demoNowView, demoUsage, type Lang } from "./zz-web-demo-data";

const OUT = process.env.BUTLER_WEB_OUT;

for (const lang of ["zh", "en"] as Lang[]) {
  test(`now page screenshot (${lang})`, async ({ makeSandbox, launch }) => {
    test.skip(!OUT, "BUTLER_WEB_OUT is not set");
    test.setTimeout(120_000);
    setUiLang(lang); // completeWizard and the assertions below read S
    const s = makeSandbox();
    s.lang = lang;
    const shop = join(s.dir, "shop");
    const repos = { frontend: makeGitRepo(join(shop, "frontend")), backend: makeGitRepo(join(shop, "backend")) };
    const { app, page } = await launch(s);
    await completeWizard(page, s);

    const call = async <T,>(channel: string, ...args: unknown[]): Promise<T> => {
      const r = (await page.evaluate(([c, a]) => (window as unknown as { butler: { invoke: (c: string, ...a: unknown[]) => Promise<unknown> } }).butler.invoke(c as string, ...(a as unknown[])), [channel, args] as const)) as { ok: boolean; value: T; message?: string };
      expect(r.ok, `${channel}: ${r.message ?? ""}`).toBe(true);
      return r.value;
    };

    const repoPaths = [repos.frontend, repos.backend];
    const epic = await call<{ id: number }>(IPC.epicsCreate, { name: DEMO.epic[lang], repoPaths });
    const featureIds: number[] = [];
    for (const f of DEMO.features) {
      const feature = await call<{ id: number }>(IPC.featuresCreate, { name: f.name[lang], repoPaths });
      await call(IPC.featuresMove, feature.id, epic.id);
      featureIds.push(feature.id);
      for (const t of f.tickets) {
        await call(IPC.ticketsCreate, { key: t.key, title: t.title[lang], repoPaths: [repos[t.repo]], featureId: feature.id });
      }
    }

    const now = Date.now();
    await app.evaluate(({ ipcMain }, { view, usage, channels }) => {
      ipcMain.removeHandler(channels.now);
      ipcMain.handle(channels.now, () => ({ ok: true, value: view }));
      ipcMain.removeHandler(channels.usage);
      ipcMain.handle(channels.usage, () => ({ ok: true, value: usage }));
    }, { view: demoNowView({ epicId: epic.id, featureIds }, now, lang), usage: demoUsage(now), channels: { now: IPC.nowView, usage: IPC.usageSummary } });

    await app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows()[0];
      w.unmaximize();
      w.setSize(1440, 900);
    });
    await page.reload();
    await page.getByRole("button", { name: S.home, exact: true }).click();

    const needs = page.locator(".now-needs");
    await expect(needs.getByRole("heading")).toHaveText(`${S.nowNeedsYou}2`);
    await expect(page.getByText(S.nowNeedsYouCount(2), { exact: false }).first()).toBeVisible();
    await expect(page.getByText(S.nowPrUnavailable)).toHaveCount(0);
    await page.locator(".now-idle .section-toggle").click();
    await page.locator(".now-usage .section-toggle").click();
    await expect(page.locator(".now-usage-details")).toBeVisible();
    await page.mouse.move(0, 0);
    // The Now page's content ends well before 1440px; crop the empty right side so the text stays legible on the site.
    const height = await page.evaluate(() => window.innerHeight);
    await page.screenshot({ path: join(OUT!, `now-${lang}.png`), clip: { x: 0, y: 0, width: 1200, height } });
  });
}
