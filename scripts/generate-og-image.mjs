import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateOgImage() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 2, // 2x for retina
  });

  const htmlPath = join(__dirname, 'generate-og-image.html');
  await page.goto(`file://${htmlPath}`);

  const outputPath = join(__dirname, '../public/og-image.png');
  await page.screenshot({
    path: outputPath,
    type: 'png',
  });

  await browser.close();
  console.log(`✅ og-image.png generated at: ${outputPath}`);
}

generateOgImage().catch(console.error);
