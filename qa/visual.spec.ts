import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import path from 'node:path';

const baseURL = process.env.BASE_URL ?? 'http://localhost:4173';
const screenshotDir = path.resolve('qa/screenshots');
const axeDir = path.resolve('qa/axe');

fs.mkdirSync(screenshotDir, { recursive: true });
fs.mkdirSync(axeDir, { recursive: true });

const routes = ['/', '/login', '/dashboard'];
const viewports: Record<string, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

const slugify = (route: string) =>
  (route === '/' ? 'home' : route.replace(/\//g, '-').replace(/^-/, '') || 'root').replace(/[^a-z0-9-]/gi, '_');

for (const route of routes) {
  const slug = slugify(route);

  for (const [label, viewport] of Object.entries(viewports)) {
    test.describe(`${route} @ ${label}`, () => {
      test(`screenshot ${label}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        const filePath = path.join(screenshotDir, `${slug}-${label}.png`);
        await page.screenshot({ path: filePath, fullPage: true });
      });
    });
  }

  test(`${route} axe scan`, async ({ page }) => {
    await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page }).analyze();
    const filePath = path.join(axeDir, `${slug}.json`);
    await fsPromises.writeFile(filePath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`${route} axe violations:`, results.violations.length);
  });
}
