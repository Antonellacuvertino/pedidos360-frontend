// Layout regression fixture. Uses the real template/CSS, without signing in or calling APIs.
const { chromium } = require('playwright');
const { readFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const output = path.join(root, '.artifacts', 'product-layout');
mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [360, 390, 768, 1024, 1280, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(`<!doctype html><html lang="es"><head><meta charset="utf-8">
        <style>${read('src/styles.css')}${read('src/app/layout/shell/shell.component.css')}
        ${read('src/app/pages/productos/productos.component.css')}</style></head><body>
        <div class="app-shell"><aside class="sidebar"><div class="brand"><b>Pedidos360</b></div>
        <nav><a>Dashboard</a><a class="active">Productos</a><a>Carrito</a><a>Mi cuenta</a><a>Streaming</a></nav></aside>
        <div class="main-area"><div class="topbar"><strong>Cuenta de prueba</strong><button>Salir</button></div>
        ${read('src/app/pages/productos/productos.component.html')}</div></div></body></html>`);
      await page.evaluate(() => {
        document.querySelectorAll('.alert, .success, .loading, .detail, [role="status"]').forEach(node => node.remove());
        document.querySelector('.page-header p').textContent = '3 productos';
        document.querySelectorAll('.product-info span').forEach(node => node.textContent = 'Perifericos');
        document.querySelectorAll('.product-info h2, .product-info h3').forEach(node => node.textContent = 'Monitor Samsung 27');
        document.querySelector('.recommendation-card .product-info p').textContent = '$189.990';
        document.querySelector('.product-card .product-info p').textContent = 'Stock disponible: 18';
        document.querySelector('.product-actions strong').textContent = '$189.990';
        document.querySelectorAll('svg').forEach(node => {
          const size = node.getAttribute('size') || '18';
          node.setAttribute('width', size);
          node.setAttribute('height', size);
        });
      });
      const check = async () => page.evaluate(() => {
        const errors = [];
        if (document.documentElement.scrollWidth > innerWidth + 1) errors.push('horizontal overflow');
        for (const card of document.querySelectorAll('.product-card, .recommendation-card')) {
          const cardRect = card.getBoundingClientRect();
          const info = card.querySelector('.product-info').getBoundingClientRect();
          for (const button of card.querySelectorAll('button')) {
            const rect = button.getBoundingClientRect();
            if (rect.left < cardRect.left || rect.right > cardRect.right + 1) errors.push('button outside card');
            if (rect.left < info.right && rect.right > info.left && rect.top < info.bottom && rect.bottom > info.top) {
              errors.push('button overlaps product name');
            }
            if (button.scrollWidth > button.clientWidth + 1) errors.push('button text overflow');
          }
          const name = card.querySelector('h2, h3');
          if (name.scrollWidth > name.clientWidth + 1) errors.push('product name overflow');
        }
        return errors;
      });
      assert.deepEqual(await check(), [], `Layout at ${width}px`);
      await page.screenshot({ path: path.join(output, `${width}.png`), fullPage: true });
      await page.evaluate(() => document.querySelectorAll('.product-info h2, .product-info h3')
        .forEach(node => node.textContent = 'MonitorUltraWideProfesionalConUnNombreMuyLargoSinEspacios'));
      assert.deepEqual(await check(), [], `Long names at ${width}px`);
      console.log(`PASS ${width}px: no overlap or horizontal overflow`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
