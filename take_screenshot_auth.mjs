import { spawn } from 'node:child_process';
import fs from 'node:fs';

const targetUrl = process.argv[2] || 'http://localhost:5173/';
const outputFile = process.argv[3] || 'D:/JOCN/Vikunja/authenticated_preview.png';
const mode = process.argv[4] || 'light';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9222;

async function getAuthToken() {
  const res = await fetch('http://localhost:5173/api/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'elweba', password: 'Elweba123!' })
  });
  const data = await res.json();
  return data.token;
}

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
    const token = await getAuthToken();
    console.log('Got token:', !!token);

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

    // Navigate to origin first to set localStorage
    await send('Page.navigate', { url: 'http://localhost:5173/login' });
    await wait(1500);

    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('token', ${JSON.stringify(token)});
        localStorage.setItem('hideAddToHomeScreenMessage', 'true');
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

    await wait(500);
    console.log('Navigating to target URL:', targetUrl);
    await send('Page.navigate', { url: targetUrl });
    await wait(3500);

    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('hideAddToHomeScreenMessage', 'true');
        const banner = document.querySelector('.add-to-home-screen');
        if (banner) banner.remove();
        if ('${mode}' === 'light') {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
        }
      `
    });

    await wait(1000);

    const info = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            url: window.location.href,
            title: document.title,
            appHtmlLen: document.getElementById('app')?.innerHTML?.length || 0,
            htmlClass: document.documentElement.className,
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
