/**
 * Şifre sıfırlama sayfası.
 *
 * Tek dosyalık, bağımlılıksız HTML: form doğrudan `/api/auth/reset-password`
 * ucuna gönderir. Kullanıcı bağlantıyı telefonunda açtıysa uygulamaya geçiş
 * bağlantısı da sunulur.
 */

/** HTML'e gömülen değerlerde etiket enjeksiyonunu engeller. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderResetPasswordPage(token: string): string {
  const safeToken = escapeHtml(token);
  const hasToken = safeToken.length > 0;

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Planova · Şifre Sıfırlama</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #0B1B2E; color: #FAFAFA; padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .card {
    width: 100%; max-width: 420px; background: #161619; border: 1px solid rgba(161,161,170,0.18);
    border-radius: 16px; padding: 28px;
  }
  h1 { margin: 0 0 8px; font-size: 20px; font-weight: 600; }
  p { margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #A1A1AA; }
  label { display: block; font-size: 13px; color: #A1A1AA; margin-bottom: 6px; }
  input {
    width: 100%; padding: 12px 14px; margin-bottom: 16px; font-size: 15px;
    background: #0F0F11; color: #FAFAFA; border: 1px solid rgba(161,161,170,0.24);
    border-radius: 10px;
  }
  input:focus { outline: none; border-color: #F97316; }
  button {
    width: 100%; padding: 13px; font-size: 15px; font-weight: 600; cursor: pointer;
    background: #F97316; color: #fff; border: 0; border-radius: 10px;
  }
  button:disabled { opacity: .55; cursor: default; }
  .msg { margin-top: 16px; font-size: 14px; line-height: 1.5; display: none; }
  .msg.err { color: #F87171; display: block; }
  .msg.ok { color: #34D399; display: block; }
  .app-link { display: block; margin-top: 18px; text-align: center; font-size: 14px; color: #FB923C; }
</style>
</head>
<body>
  <div class="card">
    <h1>Şifre Sıfırlama</h1>
    ${
      hasToken
        ? `<p>Planova hesabınız için yeni bir şifre belirleyin.</p>
    <form id="form">
      <label for="password">Yeni şifre</label>
      <input id="password" type="password" autocomplete="new-password" minlength="8" required>
      <label for="confirm">Yeni şifre (tekrar)</label>
      <input id="confirm" type="password" autocomplete="new-password" minlength="8" required>
      <button id="submit" type="submit">Şifreyi Güncelle</button>
    </form>
    <div class="msg" id="msg"></div>
    <a class="app-link" href="mimar://reset-password?token=${safeToken}">Uygulamada aç</a>`
        : `<p class="msg err">Bağlantı geçersiz görünüyor. Şifre sıfırlama e-postasındaki bağlantıyı olduğu gibi açtığınızdan emin olun.</p>`
    }
  </div>
${
  hasToken
    ? `<script>
  var form = document.getElementById('form');
  var msg = document.getElementById('msg');
  var submit = document.getElementById('submit');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var password = document.getElementById('password').value;
    var confirm = document.getElementById('confirm').value;

    if (password.length < 8) {
      msg.className = 'msg err';
      msg.textContent = 'Şifre en az 8 karakter olmalıdır.';
      return;
    }
    if (password !== confirm) {
      msg.className = 'msg err';
      msg.textContent = 'Şifreler eşleşmiyor.';
      return;
    }

    submit.disabled = true;
    msg.className = 'msg';
    msg.textContent = '';

    fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: ${JSON.stringify(token)}, newPassword: password })
    })
      .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
      .then(function (result) {
        if (!result.ok) {
          submit.disabled = false;
          msg.className = 'msg err';
          msg.textContent = result.body && result.body.message
            ? result.body.message
            : 'Şifre güncellenemedi.';
          return;
        }
        form.style.display = 'none';
        msg.className = 'msg ok';
        msg.textContent = 'Şifreniz güncellendi. Artık uygulamadan yeni şifrenizle giriş yapabilirsiniz.';
      })
      .catch(function () {
        submit.disabled = false;
        msg.className = 'msg err';
        msg.textContent = 'Bağlantı kurulamadı. Lütfen tekrar deneyin.';
      });
  });
</script>`
    : ""
}
</body>
</html>`;
}
