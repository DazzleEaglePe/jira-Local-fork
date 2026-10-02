import { spawn } from 'node:child_process';
import fs from 'node:fs';

const targetUrl = process.argv[2] || 'http://localhost:5173/login';
const outputFile = process.argv[3] || 'D:/JOCN/Vikunja/preview.png';
const mode = process.argv[4] || 'light'; // 'light' or 'dark'

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9222;

const edge = spawn(edgePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  '--window-size=1280,900',
  '--force-device-scale-factor=1',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
], { stdio: 'ignore' });

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let ws = null;
let msgId = 1;
const pending = new Map();

function send(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  try {
    // Wait for Edge to start listening
    let pageMeta = null;
    for (let i = 0; i < 20; i++) {
      await wait(300);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`);
        if (res.ok) {
          const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
          const list = await listRes.json();
          pageMeta = list.find(p => p.type === 'page') || list[0];
          break;
        }
      } catch {}
    }

    if (!pageMeta) {
      throw new Error('Edge did not start CDP endpoint');
    }

    ws = new WebSocket(pageMeta.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-color-scheme', value: mode }]
    });

    await send('Page.navigate', { url: targetUrl });
    await wait(2500);

    // If mode is light, ensure class="light" and localStorage
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('hideAddToHomeScreenMessage', 'true');
        const banner = document.querySelector('.add-to-home-screen');
        if (banner) banner.remove();
        if ('${mode}' === 'light') {
          localStorage.setItem('color_scheme_guest', 'light');
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        } else {
          localStorage.setItem('color_scheme_guest', 'dark');
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
        }
      `
    });

    await wait(800);

    const info = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.noauth-card');
          const wrapper = document.querySelector('.no-auth-wrapper');
          const app = document.getElementById('app');
          return {
            url: window.location.href,
            appRect: app ? app.getBoundingClientRect() : null,
            appStyle: app ? {
              display: getComputedStyle(app).display,
              width: getComputedStyle(app).width,
              height: getComputedStyle(app).height,
              margin: getComputedStyle(app).margin,
              padding: getComputedStyle(app).padding,
            } : null,
            bodyStyle: {
              width: getComputedStyle(document.body).width,
              height: getComputedStyle(document.body).height,
              margin: getComputedStyle(document.body).margin,
              overflow: getComputedStyle(document.body).overflow,
            },
            htmlStyle: {
              width: getComputedStyle(document.documentElement).width,
              height: getComputedStyle(document.documentElement).height,
              fontSize: getComputedStyle(document.documentElement).fontSize,
              zoom: getComputedStyle(document.documentElement).zoom,
            },
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            devicePixelRatio: window.devicePixelRatio,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('INFO:', info.result.value);

    const { data } = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });

    fs.writeFileSync(outputFile, Buffer.from(data, 'base64'));
    console.log(`Screenshot saved to ${outputFile}`);
  } finally {
    if (ws) ws.close();
    edge.kill();
  }
}

run().catch(err => {
  console.error(err);
  edge.kill();
  process.exit(1);
});
