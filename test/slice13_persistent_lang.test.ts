import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";

/**
 * Automated Verification Suite for Slice 13:
 * Persistent Multi-Language Session Routing & Zero-Bounce Tab Navigation
 * WHY: Proves that language preference does not reset when changing tabs,
 * cookies are issued and respected, and active buttons do not trigger refreshes (Habit 08).
 */

test("Slice 13: GET /portal?lang=en sets persistent session cookie sgroup_lang=en", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/portal?lang=en",
  });

  assert.equal(res.statusCode, 200);
  const setCookie = res.headers["set-cookie"];
  assert.ok(setCookie);
  assert.match(String(setCookie), /sgroup_lang=en/);
  assert.match(String(setCookie), /Max-Age=31536000/);

  await app.close();
});

test("Slice 13: Subsequent tab navigation without query param respects sgroup_lang cookie and stays in English", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  // Tab navigation to /portal/tracking without ?lang=en, passing Cookie header
  const resTracking = await app.inject({
    method: "GET",
    url: "/portal/tracking",
    headers: {
      cookie: "sgroup_lang=en",
    },
  });

  assert.equal(resTracking.statusCode, 200);
  const htmlTracking = resTracking.payload;

  // Must render English tracking labels, NOT reset to German
  assert.match(htmlTracking, /Live Telematics Status Timeline/);
  assert.match(htmlTracking, /Carrier Reference:/);
  assert.match(htmlTracking, /Total Weight/);
  assert.match(htmlTracking, /lang="en"/);

  // Tab navigation to /portal/dispatch without ?lang=en, passing Cookie header
  const resDispatch = await app.inject({
    method: "GET",
    url: "/portal/dispatch",
    headers: {
      cookie: "sgroup_lang=en",
    },
  });

  assert.equal(resDispatch.statusCode, 200);
  const htmlDispatch = resDispatch.payload;

  assert.match(htmlDispatch, /Dispatch &amp; Feeder Fleet Planning|Dispatch & Feeder Fleet Planning/);
  assert.match(htmlDispatch, /Total Tours/);
  assert.match(htmlDispatch, /lang="en"/);

  await app.close();
});

test("Slice 13: Layout navigation links explicitly propagate lang query parameter", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const resEn = await app.inject({
    method: "GET",
    url: "/portal?lang=en",
  });

  assert.equal(resEn.statusCode, 200);
  const htmlEn = resEn.payload;

  // Header navigation links must carry ?lang=en
  assert.match(htmlEn, /href="\/portal\/audit\?lang=en"/);
  assert.match(htmlEn, /href="\/portal\/reconcile\?lang=en"/);
  assert.match(htmlEn, /href="\/portal\/quarantine\?lang=en"/);
  assert.match(htmlEn, /href="\/portal\/dispatch\?lang=en"/);
  assert.match(htmlEn, /href="\/portal\/ledger\?lang=en"/);
  assert.match(htmlEn, /href="\/portal\?lang=en"/);

  await app.close();
});

test("Slice 13: Client navigation.js contains active language no-op guard and link enhancer", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/static/js/navigation.js",
  });

  assert.equal(res.statusCode, 200);
  const js = res.payload;

  assert.match(js, /btn\.classList\.contains\("active"\)/);
  assert.match(js, /sgroup_lang/);
  assert.match(js, /activePortalLang/);

  await app.close();
});
