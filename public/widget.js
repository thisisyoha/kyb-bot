(function () {
  if (window.__mAiLoaded) return;
  window.__mAiLoaded = true;

  // Derive base URL from the script tag itself
  var scriptEl = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var BASE_URL = scriptEl && scriptEl.src
    ? scriptEl.src.replace(/\/widget\.js.*$/, '')
    : 'https://kyb-bot.vercel.app';

  // Read page context from data attribute: <script src="...widget.js" data-page="ubo-step">
  var page = (scriptEl && scriptEl.getAttribute('data-page')) || 'unknown';

  // Generate a session ID for this widget load
  var sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);

  // Build iframe URL with context
  var iframeSrc = BASE_URL + '?page=' + encodeURIComponent(page) + '&session=' + encodeURIComponent(sessionId);

  var style = document.createElement('style');
  style.id = 'mai-style';
  style.textContent = [
    '#mai-launcher{position:fixed;bottom:24px;left:24px;z-index:10100;display:flex;flex-direction:column;align-items:flex-start;gap:12px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}',
    '#mai-frame-wrap{display:none;width:400px;height:600px;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.22);animation:maiSlideUp 0.22s ease-out;}',
    '#mai-frame-wrap.mai-open{display:block;}',
    '#mai-frame{width:100%;height:100%;border:none;display:block;}',
    '#mai-btn{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#1D4ED8);border:none;cursor:pointer;box-shadow:0 4px 16px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;transition:transform 0.2s,box-shadow 0.2s;flex-shrink:0;}',
    '#mai-btn:hover{transform:scale(1.08);box-shadow:0 6px 22px rgba(59,130,246,0.65);}',
    '@keyframes maiSlideUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}'
  ].join('');
  document.head.appendChild(style);

  var ICON_CHAT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_CLOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>';

  var launcher = document.createElement('div');
  launcher.id = 'mai-launcher';

  var frameWrap = document.createElement('div');
  frameWrap.id = 'mai-frame-wrap';

  var iframe = document.createElement('iframe');
  iframe.id = 'mai-frame';
  iframe.src = iframeSrc;
  iframe.title = 'M.ai Verification Assistant';
  iframe.setAttribute('allow', 'clipboard-write');
  frameWrap.appendChild(iframe);

  var btn = document.createElement('button');
  btn.id = 'mai-btn';
  btn.setAttribute('aria-label', 'Open M.ai assistant');
  btn.innerHTML = ICON_CHAT;

  var isOpen = false;

  function notifyClose() {
    // Tell the iframe the widget is closing so it can log the conversation
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'mai-widget-closed' }, BASE_URL);
    }
  }

  btn.addEventListener('click', function () {
    isOpen = !isOpen;
    if (isOpen) {
      frameWrap.classList.add('mai-open');
      btn.innerHTML = ICON_CLOSE;
      btn.setAttribute('aria-label', 'Close M.ai assistant');
    } else {
      notifyClose();
      frameWrap.classList.remove('mai-open');
      btn.innerHTML = ICON_CHAT;
      btn.setAttribute('aria-label', 'Open M.ai assistant');
    }
  });

  launcher.appendChild(frameWrap);
  launcher.appendChild(btn);
  document.body.appendChild(launcher);

  // Expose destroy for graceful unmount (e.g. React route change)
  window.mAiWidget = {
    destroy: function () {
      notifyClose();
      var el = document.getElementById('mai-launcher');
      var st = document.getElementById('mai-style');
      if (el) el.parentNode.removeChild(el);
      if (st) st.parentNode.removeChild(st);
      window.__mAiLoaded = false;
      delete window.mAiWidget;
    }
  };
})();
