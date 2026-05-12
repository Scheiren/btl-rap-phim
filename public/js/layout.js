async function loadPartial(targetId, url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Không tải được ${url}: ${resp.status}`);
  document.getElementById(targetId).innerHTML = await resp.text();
}

async function bootstrapLayout() {
  await loadPartial('sidebar-placeholder', 'components/sidebar.html');
  await loadPartial('main-placeholder', 'components/main.html');
  await loadPartial('modals-placeholder', 'components/modals.html');
  const mainModule = await import('./main.js');
  if (typeof mainModule.initApp === 'function') {
    mainModule.initApp();
  }
}

bootstrapLayout().catch(err => {
  console.error('Layout load failed', err);
  document.body.innerHTML = `<pre style="color:#f88;background:#111;padding:20px;">${err.message}</pre>`;
});
