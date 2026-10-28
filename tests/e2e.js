const { chromium } = require('playwright');
const crypto = require('crypto');
const sha = s => crypto.createHash('sha1').update(s).digest('hex');
const blobs = {}; const repos = {};
function mk(name, files) {
  const r = { name, branch: 'main', commits: {}, trees: {}, head: null, log: [] };
  const t = {};
  for (const [p, c] of Object.entries(files)) { const b = Buffer.from(c).toString('base64'); const s = sha(b); blobs[s] = b; t[p] = { mode: '100644', sha: s }; }
  commit(r, t, 'init', null); repos['me/' + name] = r; return r;
}
function commit(r, tree, msg, parent) {
  const ts = sha(JSON.stringify(tree)); r.trees[ts] = tree;
  const cs = sha(ts + msg + Math.random()); r.commits[cs] = { tree: ts, msg, parent }; r.head = cs; r.log.push(msg); return cs;
}
mk('alpha', { 'README.md': 'hi', 'docs/a.txt': 'A', 'docs/sub/b.txt': 'B', 'src/x.js': 'X' });
mk('beta', { 'top.txt': 'T', 'lib/l.txt': 'L' });
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1300, height: 800 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  page.on('dialog', d => d.accept(d.type() === 'prompt' ? (d.message().includes('New folder') ? 'newdir' : 'alpha2') : undefined));
  await page.route('https://api.github.com/**', async route => {
    const req = route.request(), u = new URL(req.url()), m = req.method();
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const send = (o, s = 200) => route.fulfill({ status: s, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(o) });
    const p = u.pathname; let x;
    const body = req.postData() ? JSON.parse(req.postData()) : {};
    const repoObj = full => ({ id: full.length, name: full.split('/')[1], full_name: full, private: false, default_branch: 'main', html_url: 'https://github.com/' + full, owner: { login: 'me' } });
    if (p === '/user') return send({ login: 'me' });
    if (p === '/user/repos') return send(Object.keys(repos).map(repoObj));
    if ((x = p.match(/^\/repos\/(me\/[^/]+)(\/.*)?$/))) {
      const full = x[1], r = repos[full], rest = x[2] || '';
      if (!rest && m === 'PATCH') { repos['me/' + body.name] = r; delete repos[full]; return send({ ...repoObj('me/' + body.name), id: full.length }); }
      if (rest === '/branches') return send([{ name: 'main' }]);
      if (rest === '/git/ref/heads/main') return send({ object: { sha: r.head } });
      if ((x = rest.match(/^\/git\/commits\/(.+)$/))) return send({ tree: { sha: r.commits[x[1]].tree } });
      if ((x = rest.match(/^\/git\/trees\/(.+)$/))) return send({ truncated: false, tree: Object.entries(r.trees[x[1]]).map(([path, e]) => ({ path, type: 'blob', ...e })) });
      if ((x = rest.match(/^\/git\/blobs\/(.+)$/))) return send({ content: blobs[x[1]].replace(/(.{60})/g, '$1\n'), encoding: 'base64' });
      if (rest === '/git/blobs' && m === 'POST') { const b64 = body.encoding === 'base64' ? body.content : Buffer.from(body.content).toString('base64'); const s = sha(b64); blobs[s] = b64; return send({ sha: s }, 201); }
      if (rest === '/git/trees') { const t = { ...r.trees[body.base_tree] }; for (const e of body.tree) { if (e.sha === null) delete t[e.path]; else t[e.path] = { mode: e.mode, sha: e.sha }; } const ts = sha(JSON.stringify(t)); r.trees[ts] = t; return send({ sha: ts }, 201); }
      if (rest === '/git/commits') { const cs = sha(body.tree + body.message + Math.random()); r.commits[cs] = { tree: body.tree, msg: body.message, parent: body.parents[0] }; r._pend = cs; r.log.push(body.message); return send({ sha: cs }, 201); }
      if (rest === '/git/refs/heads/main') { r.head = body.sha; return send({}); }
    }
    return send({ message: 'Not Found ' + p }, 404);
  });
  const tree = full => repos[full].trees[repos[full].commits[repos[full].head].tree];
  const ok = (c, m) => { if (!c) { console.log('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };
  await page.goto('file://' + process.argv[2]);
  await page.fill('#tok', 'x'); await page.click('#go');
  await page.waitForSelector('.pane .repoPick');
  const pick = async (i, name) => { const el = page.locator('.repoPick').nth(i); await el.click(); await el.fill(name); await el.dispatchEvent('change'); };
  await pick(0, 'me/alpha'); await pick(1, 'me/beta');
  await page.waitForSelector('.pane:nth-child(1) .row[data-path="docs"]'); await page.waitForSelector('.pane:nth-child(2) .row[data-path="lib"]');
  const P = i => `.pane:nth-child(${i})`; const row = (i, p) => page.locator(`${P(i)} .row[data-path="${p}"]`);
  await page.click(`${P(1)} .expandAll`); await page.click(`${P(2)} .expandAll`);
  // 1. same-pane move: src/x.js -> docs
  await row(1, 'src/x.js').dragTo(row(1, 'docs'));
  ok(await page.locator(`${P(1)} .summary`).textContent() === '1 moved/renamed', 'file move staged within pane');
  // 2. folder into itself refused
  await row(1, 'docs').dragTo(row(1, 'docs/sub').or(row(1, 'docs')).first()).catch(() => {});
  // 3. rename folder via F2
  await row(1, 'docs').click(); await page.keyboard.press('F2'); await page.keyboard.type('documents'); await page.keyboard.press('Enter');
  ok(await row(1, 'documents').count() === 1, 'folder renamed inline');
  // 4. commit pane 1
  await page.click(`${P(1)} .commit`); await page.waitForFunction(() => document.querySelector('.pane .commitBar:not(.show)'));
  await page.waitForTimeout(300);
  let t = tree('me/alpha'); ok(t['documents/x.js'] && t['documents/a.txt'] && t['documents/sub/b.txt'] && !t['docs/a.txt'] && !t['src/x.js'], 'rename+move committed correctly');
  ok(repos['me/alpha'].log.length === 2, 'single commit created');
  await page.click(`${P(1)} .expandAll`); await page.click(`${P(2)} .expandAll`);
  // 5. cross-repo COPY: alpha documents -> beta lib
  await row(2, 'lib').scrollIntoViewIfNeeded();
  await row(1, 'documents').dragTo(row(2, 'lib'));
  ok(/\d+ added/.test(await page.locator(`${P(2)} .summary`).textContent()), 'cross-pane copy staged in beta: ' + await page.locator(`${P(2)} .summary`).textContent());
  ok(!(await page.locator(`${P(1)} .commitBar.show`).count()), 'source untouched on copy');
  await page.click(`${P(2)} .commit`); await page.waitForTimeout(600);
  t = tree('me/beta'); ok(t['lib/documents/a.txt'] && t['lib/documents/sub/b.txt'] && t['lib/documents/x.js'], 'files copied into beta');
  ok(Buffer.from(blobs[t['lib/documents/a.txt'].sha], 'base64').toString() === 'A', 'blob content intact');
  ok(repos['me/beta'].log.at(-1).startsWith('Copy 3 files from me/alpha'), 'auto message: ' + repos['me/beta'].log.at(-1));
  // 6. cross-repo MOVE via shift: beta top.txt -> alpha root
  await page.selectOption('#mode','move'); await row(2, 'top.txt').dragTo(row(1, ''));
  ok(await page.locator(`${P(1)} .summary`).textContent() === '1 added' && /1 deleted/.test(await page.locator(`${P(2)} .summary`).textContent()), 'move mode (add in dest, delete in source)');
  await page.click('#commitAll'); await page.waitForTimeout(900);
  ok(tree('me/alpha')['top.txt'] && !tree('me/beta')['top.txt'], 'Commit both applied move');
  // 7. collision skip
  await row(2, 'lib/documents').or(row(2,'lib')).first().click();
  // 8. OS file upload
  await page.locator(`${P(1)} .tree`).evaluate(async el => {
    const dt = new DataTransfer(); dt.items.add(new File(['hello'], 'up.txt'));
    const root = el.querySelector('.row.root');
    root.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    root.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  await page.waitForTimeout(200);
  ok(await row(1, 'up.txt').count() === 1, 'OS file drop stages upload');
  await page.click(`${P(1)} .undo`); ok(await row(1, 'up.txt').count() === 0, 'undo works');
  // 9. repo rename
  await page.locator(`${P(1)} .renameRepo`).click(); await page.waitForTimeout(300);
  ok(!!repos['me/alpha2'] && (await page.locator('.repoPick').first().inputValue()) === 'me/alpha2', 'repo renamed');
  await page.screenshot({ path: process.argv[3] });
  console.log('errors:', errs); await b.close();
})();
