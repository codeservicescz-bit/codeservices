document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const translations = {
  'Služby': 'Services', 'Jak to funguje': 'How it works', 'Přihlásit se': 'Log in',
  'Objednat službu': 'Order a service', 'Prohlédnout služby': 'Browse services',
  'Vytvořit účet': 'Create an account', 'co umím připravit': 'what I can prepare',
  'jednoduchý postup': 'simple process', 'máte nápad?': 'have an idea?',
  'Minecraft & server služby': 'Minecraft & server services', 'Váš server.': 'Your server.',
  'Vaše pravidla.': 'Your rules.', 'Služby, které dají': 'Services that bring',
  'vašemu projektu řád.': 'order to your project.', 'Bez zbytečného': 'Without needless',
  'čekání a chaosu.': 'waiting and chaos.', 'Pojďme ho': "Let's build",
  'postavit.': 'it together.', 'CENA': 'PRICE', 'cena': 'price', 'od': 'from',
  'dle domluvy': 'on request'
};
const languageNames = { cs: 'Čeština', en: 'English', sk: 'Slovenčina', de: 'Deutsch', pl: 'Polski', es: 'Español' };
const extraTranslations = {
  sk: { 'Služby':'Služby','Jak to funguje':'Ako to funguje','Přihlásit se':'Prihlásiť sa','Objednat službu':'Objednať službu','Prohlédnout služby':'Pozrieť služby','Vytvořit účet':'Vytvoriť účet','Váš server.':'Váš server.','Vaše pravidla.':'Vaše pravidlá.','Minecraft & server služby':'Minecraft a serverové služby','co umím připravit':'čo viem pripraviť','jednoduchý postup':'jednoduchý postup','máte nápad?':'máte nápad?','Pojďme ho':'Poďme ho','postavit.':'postaviť.' },
  de: { 'Služby':'Dienstleistungen','Jak to funguje':'So funktioniert es','Přihlásit se':'Anmelden','Objednat službu':'Service bestellen','Prohlédnout služby':'Services ansehen','Vytvořit účet':'Konto erstellen','Váš server.':'Dein Server.','Vaše pravidla.':'Deine Regeln.','Minecraft & server služby':'Minecraft- & Serverdienste','co umím připravit':'was ich vorbereiten kann','jednoduchý postup':'einfacher Ablauf','máte nápad?':'Hast du eine Idee?','Pojďme ho':'Lass es uns','postavit.':'bauen.' },
  pl: { 'Služby':'Usługi','Jak to funguje':'Jak to działa','Přihlásit se':'Zaloguj się','Objednat službu':'Zamów usługę','Prohlédnout služby':'Zobacz usługi','Vytvořit účet':'Utwórz konto','Váš server.':'Twój serwer.','Vaše pravidla.':'Twoje zasady.','Minecraft & server služby':'Usługi Minecraft i serwerowe','co umím připravit':'co mogę przygotować','jednoduchý postup':'prosty proces','máte nápad?':'Masz pomysł?','Pojďme ho':'Zbudujmy','postavit.':'go razem.' },
  es: { 'Služby':'Servicios','Jak to funguje':'Cómo funciona','Přihlásit se':'Iniciar sesión','Objednat službu':'Pedir servicio','Prohlédnout služby':'Ver servicios','Vytvořit účet':'Crear cuenta','Váš server.':'Tu servidor.','Vaše pravidla.':'Tus reglas.','Minecraft & server služby':'Servicios de Minecraft y servidores','co umím připravit':'lo que puedo preparar','jednoduchý postup':'proceso sencillo','máte nápad?':'¿Tienes una idea?','Pojďme ho':'Vamos a','postavit.':'crearlo.' }
};
function translatePublicPage() {
  const selectedLanguage = localStorage.getItem('language') || 'cs';
  if (selectedLanguage === 'cs') return;
  document.documentElement.lang = selectedLanguage;
  const activeTranslations = selectedLanguage === 'en' ? translations : extraTranslations[selectedLanguage];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => { const trimmed = node.nodeValue.trim(); if (activeTranslations?.[trimmed]) node.nodeValue = node.nodeValue.replace(trimmed, activeTranslations[trimmed]); });
  document.querySelector('#language-trigger').textContent = `🌐 ${languageNames[selectedLanguage]}`;
}
function openLanguagePicker() {
  const dialog = document.createElement('div');
  dialog.className = 'social-dialog';
  const triggerBox = document.querySelector('#language-trigger').getBoundingClientRect();
  dialog.style.setProperty('--social-left', `${Math.max(12, triggerBox.right - 330)}px`);
  dialog.style.setProperty('--social-top', `${triggerBox.bottom + 12}px`);
  dialog.innerHTML = `<div class="language-card" role="dialog" aria-modal="true"><button class="language-close" aria-label="Close">×</button><p>🌐 ${localStorage.getItem('language') === 'en' ? 'Choose language' : 'Vyberte jazyk'}</p><button data-language="cs"><span class="flag flag-cs"></span>Čeština</button><button data-language="en"><span class="flag flag-en"></span>English</button><button data-language="sk"><span class="flag flag-sk"></span>Slovenčina</button><button data-language="de"><span class="flag flag-de"></span>Deutsch</button><button data-language="pl"><span class="flag flag-pl"></span>Polski</button><button data-language="es"><span class="flag flag-es"></span>Español</button></div>`;
  dialog.addEventListener('click', (event) => { if (event.target === dialog || event.target.closest('.language-close')) dialog.remove(); const choice = event.target.closest('[data-language]'); if (choice) { localStorage.setItem('language', choice.dataset.language); window.location.reload(); } });
  document.body.append(dialog);
}
function openSocialPicker() {
  const dialog = document.createElement('div');
  dialog.className = 'social-dialog';
  const triggerBox = document.querySelector('#social-trigger').getBoundingClientRect();
  dialog.style.setProperty('--social-left', `${Math.max(12, triggerBox.right - 330)}px`);
  dialog.style.setProperty('--social-top', `${triggerBox.bottom + 12}px`);
  dialog.innerHTML = '<div class="language-card social-card" role="dialog" aria-modal="true"><button class="language-close" aria-label="Close">×</button><p>✨ Sociální sítě</p><span class="social-note">Přidejte se k naší komunitě.</span><a class="social-item" href="https://discord.gg/pdzKxS3fVu" target="_blank" rel="noopener noreferrer">🎮 Discord <small>otevřít ↗</small></a><button class="social-item" type="button">🎵 TikTok <small>brzy</small></button><button class="social-item" type="button">▶️ YouTube <small>brzy</small></button><button class="social-item" type="button">📸 Instagram <small>brzy</small></button></div>';
  dialog.addEventListener('click', (event) => { if (event.target === dialog || event.target.closest('.language-close')) dialog.remove(); });
  document.body.append(dialog);
}
document.querySelector('#language-trigger').addEventListener('click', openLanguagePicker);
document.querySelector('#social-trigger').addEventListener('click', openSocialPicker);
document.head.insertAdjacentHTML('beforeend', '<style>.language-trigger{border:0;background:none;font:700 13px Manrope,Arial,sans-serif;color:#152320;cursor:pointer;padding:0}.language-dialog{position:fixed;inset:0;z-index:10;display:grid;place-items:center;background:#15232099;padding:20px;animation:fade-in .18s ease-out}.social-dialog{position:fixed;inset:0;z-index:10}.social-dialog .social-card{position:absolute;left:var(--social-left);top:var(--social-top);transform-origin:top right;animation:macos-pop .32s cubic-bezier(.2,1.25,.35,1)}.language-card{position:relative;width:min(330px,calc(100vw - 24px));background:#fffdf8;padding:30px;box-shadow:7px 7px 0 #b8dc42;animation:card-in .23s cubic-bezier(.2,.9,.3,1.2)}.language-card p{margin:0 0 20px;font:800 18px Manrope,Arial,sans-serif}.language-card button[data-language],.social-item{display:flex;align-items:center;gap:10px;width:100%;margin:9px 0;padding:12px;border:1px solid #d5d0c6;background:#fff;text-align:left;font:700 14px Manrope,Arial,sans-serif;cursor:pointer;text-decoration:none;color:#152320}.language-card button[data-language]:hover,.social-item:hover{border-color:#5e83e6;background:#eef2ff;transform:translateX(3px)}.language-close{position:absolute;right:12px;top:9px;border:0;background:none;font-size:24px;cursor:pointer}.social-note{display:block;margin:-12px 0 16px;color:#68736d;font-size:12px}.social-item small{margin-left:auto;color:#68736d;font:10px DM Mono,monospace}@keyframes fade-in{from{opacity:0}to{opacity:1}}@keyframes card-in{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}@keyframes macos-pop{0%{opacity:0;transform:translateY(-12px) scale(.86)}65%{opacity:1;transform:translateY(2px) scale(1.02)}100%{transform:translateY(0) scale(1)}}.flag{position:relative;display:inline-block;width:31px;height:21px;overflow:hidden;border-radius:4px;box-shadow:0 1px 2px #15232055;flex:none}.flag-cs,.flag-sk{background:linear-gradient(#fff 0 50%,#d7141a 50%)}.flag-cs:before,.flag-sk:before{content:"";position:absolute;border-top:11px solid transparent;border-bottom:11px solid transparent;border-left:16px solid #11457e}.flag-en{background:linear-gradient(30deg,transparent 42%,#fff 43% 49%,#c8102e 50% 55%,transparent 56%),linear-gradient(-30deg,transparent 42%,#fff 43% 49%,#c8102e 50% 55%,transparent 56%),linear-gradient(#012169 0 100%)}.flag-en:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 38%,#fff 39% 61%,transparent 62%),linear-gradient(transparent 36%,#fff 37% 63%,transparent 64%)}.flag-en:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 44%,#c8102e 45% 55%,transparent 56%),linear-gradient(transparent 43%,#c8102e 44% 56%,transparent 57%)}.flag-de{background:linear-gradient(#111 0 33%,#dd0000 33% 66%,#ffce00 66%)}.flag-pl{background:linear-gradient(#fff 0 50%,#dc143c 50%)}.flag-es{background:linear-gradient(#aa151b 0 25%,#f1bf00 25% 75%,#aa151b 75%)}</style>');
translatePublicPage();
