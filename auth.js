const notice = document.querySelector('#notice');
const show = (message, error = false) => { notice.textContent = message; notice.className = `notice ${error ? 'error' : 'success'}`; };
document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
  const login = button.dataset.tab === 'login';
  document.querySelector('#login-form').classList.toggle('hidden', !login);
  document.querySelector('#register-form').classList.toggle('hidden', login);
  document.querySelectorAll('[data-tab]').forEach((tab) => tab.classList.toggle('active', tab === button));
  notice.textContent = '';
}));
if (new URLSearchParams(window.location.search).get('mode') === 'register') document.querySelector('[data-tab="register"]').click();
async function submit(form, url) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}
document.querySelector('#register-form').addEventListener('submit', async (event) => { event.preventDefault(); try { const data = await submit(event.currentTarget, '/api/register'); show(data.message); document.querySelector('[data-tab="login"]').click(); } catch (error) { show(error.message, true); } });
document.querySelector('#login-form').addEventListener('submit', async (event) => { event.preventDefault(); try { await submit(event.currentTarget, '/api/login'); window.location.href = 'account.html'; } catch (error) { show(error.message, true); } });
