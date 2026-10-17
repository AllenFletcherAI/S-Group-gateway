import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";

/**
 * Automated Verification Suite for Slice 12:
 * Dark Mode & Light Mode Theme Engine with Anti-FOUC Instant Toggle
 * WHY: Proves that the layout, stylesheets, and client controllers
 * provide accessible, instant contrast switching without FOUC (Habit 08).
 */

test("Slice 12: Layout renders synchronous anti-FOUC initialization script in <head>", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/portal",
  });

  assert.equal(res.statusCode, 200);
  const html = res.payload;

  // Anti-FOUC script checks
  assert.match(html, /localStorage\.getItem\("sgroup_theme"\)/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /setAttribute\("data-theme", theme\)/);
  assert.match(html, /classList\.add\("theme-dark"\)/);

  await app.close();
});

test("Slice 12: Layout renders accessible header theme toggle button and user menu control", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  // Test German view
  const resDe = await app.inject({
    method: "GET",
    url: "/portal?lang=de",
  });

  assert.equal(resDe.statusCode, 200);
  const htmlDe = resDe.payload;

  assert.match(htmlDe, /id="theme-toggle-btn"/);
  assert.match(htmlDe, /class="theme-toggle-btn"/);
  assert.match(htmlDe, /id="theme-toggle-icon"/);
  assert.match(htmlDe, /id="dropdown-theme-toggle"/);
  assert.match(htmlDe, /Erscheinungsbild umschalten/);

  // Test English view
  const resEn = await app.inject({
    method: "GET",
    url: "/portal?lang=en",
  });

  assert.equal(resEn.statusCode, 200);
  const htmlEn = resEn.payload;

  assert.match(htmlEn, /id="theme-toggle-btn"/);
  assert.match(htmlEn, /Toggle display theme/);
  assert.match(htmlEn, /Switch to Dark Mode/);

  await app.close();
});

test("Slice 12: Static layout.css stylesheet serves [data-theme='dark'] tokens and high-contrast styles", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/static/css/layout.css",
  });

  assert.equal(res.statusCode, 200);
  const css = res.payload;

  // Dark Mode custom properties
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /\.theme-dark/);
  assert.match(css, /--color-bg-neutral: #0B1320;/);
  assert.match(css, /--color-surface-white: #111E33;/);
  assert.match(css, /--color-border-slate: #1E2F4D;/);

  // Theme toggle button styles
  assert.match(css, /\.theme-toggle-btn/);
  assert.match(css, /\.theme-toggle-icon/);

  await app.close();
});

test("Slice 12: Static navigation.js client script serves theme controller and persistence logic", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/static/js/navigation.js",
  });

  assert.equal(res.statusCode, 200);
  const js = res.payload;

  assert.match(js, /sgroup_theme/);
  assert.match(js, /applyTheme/);
  assert.match(js, /toggleTheme/);
  assert.match(js, /themeToggleBtn/);
  assert.match(js, /dropdownThemeToggle/);

  await app.close();
});
