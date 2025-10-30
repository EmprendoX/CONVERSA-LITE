(() => {
  const currentScript = document.currentScript;
  const cfg = (name, def) => (currentScript?.getAttribute(`data-${name}`) ?? def);

  const title = cfg('title', '¿Necesitas ayuda?');
  const color = cfg('color', '#0ea5e9');
  const position = cfg('position', 'bottom-right'); // bottom-right | bottom-left
  const greet = cfg('greet', 'Hola 👋 ¿En qué puedo ayudarte hoy?');
  const host = cfg('host', window.location.origin);
  const apiBase = cfg('api-base', '/api/public');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = title;
  btn.style.position = 'fixed';
  btn.style.zIndex = '2147483647';
  btn.style.padding = '10px 14px';
  btn.style.borderRadius = '999px';
  btn.style.border = 'none';
  btn.style.cursor = 'pointer';
  btn.style.color = '#fff';
  btn.style.background = color;
  btn.style.boxShadow = '0 6px 20px rgba(0,0,0,.15)';
  btn.style.font = '500 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  if (position === 'bottom-left') {
    btn.style.left = '20px';
  } else {
    btn.style.right = '20px';
  }
  btn.style.bottom = '20px';

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,.2)';
  overlay.style.zIndex = '2147483646';
  overlay.style.display = 'none';

  const frame = document.createElement('iframe');
  frame.title = 'Asistente de Conversa';
  frame.style.position = 'fixed';
  frame.style.zIndex = '2147483647';
  frame.style.width = '360px';
  frame.style.height = '560px';
  frame.style.border = '1px solid rgba(0,0,0,.1)';
  frame.style.borderRadius = '12px';
  frame.style.background = '#fff';
  frame.style.boxShadow = '0 16px 40px rgba(0,0,0,.2)';
  frame.style.display = 'none';
  if (position === 'bottom-left') {
    frame.style.left = '20px';
  } else {
    frame.style.right = '20px';
  }
  frame.style.bottom = '72px';
  const url = new URL(host);
  if (!url.searchParams.get('apiBase')) url.searchParams.set('apiBase', apiBase);
  url.searchParams.set('embed', '1');
  frame.src = url.toString();

  function open() {
    overlay.style.display = 'block';
    frame.style.display = 'block';
  }
  function close() {
    overlay.style.display = 'none';
    frame.style.display = 'none';
  }

  overlay.addEventListener('click', close);
  btn.addEventListener('click', () => {
    if (frame.style.display === 'none') open();
    else close();
  });

  document.body.appendChild(btn);
  document.body.appendChild(overlay);
  document.body.appendChild(frame);

  // Mensaje de bienvenida opcional (no intrusivo)
  if (greet && 'postMessage' in window) {
    setTimeout(() => {
      try {
        frame.contentWindow?.postMessage({ type: 'greet', message: greet }, '*');
      } catch {}
    }, 1200);
  }
})();


