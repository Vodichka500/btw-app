export const authInjectionHtml = `
  <div id="auth-widget-container" style="position:fixed; bottom:20px; right:20px; background:#fff; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.15); z-index:9999; border: 1px solid #e2e8f0; font-family: sans-serif; width: 320px; overflow: hidden; transition: all 0.3s ease;">
    
    <div onclick="toggleAuthWidget()" style="background: #0f172a; color: white; padding: 12px 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 14px;">
      <span>🔐 Better Auth Login</span>
      <span id="auth-widget-toggle-icon" style="font-size: 16px;">▼</span>
    </div>
    
    <div id="auth-widget-body" style="padding: 15px; display: block;">
      
      <div id="auth-login-form" style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <input type="email" id="auth-email" placeholder="Email" style="width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px; font-size: 13px; outline: none;" />
        <input type="password" id="auth-pass" placeholder="Пароль" style="width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px; font-size: 13px; outline: none;" />
        <button onclick="loginWithBetterAuth(event)" style="background: #2563eb; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; width: 100%; font-size: 13px; font-weight: bold; transition: 0.2s;">
          Получить токен
        </button>
      </div>

      <div id="auth-success-area" style="display: none; margin-top: 15px;">
        <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 10px; border-radius: 8px; color: #065f46; font-size: 12px; margin-bottom: 10px;">
          <strong>✅ Успешно! Что делать дальше:</strong>
          <ol style="margin: 5px 0 0 15px; padding: 0;">
            <li>Скопируй токен из поля ниже.</li>
            <li>Открой вкладку <b>Headers</b> в tRPC панели (внизу страницы).</li>
            <li>Вставь туда этот JSON:</li>
          </ol>
          <pre style="background: #064e3b; color: #fff; padding: 8px; border-radius: 4px; overflow-x: auto; margin-top: 8px;">{
  "Authorization": "Bearer ТВОЙ_ТОКЕН"
}</pre>
        </div>
        
        <input type="text" id="auth-result-token" readonly onclick="this.select()" style="width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; background: #f1f5f9; cursor: copy;" />
        
        <button onclick="copyToken()" style="background: #0f172a; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; width: 100%; font-size: 13px; font-weight: bold; margin-top: 8px;">
          📋 Скопировать JSON для Headers
        </button>
      </div>

    </div>
    
    <script>
      // Функция сворачивания/разворачивания виджета
      function toggleAuthWidget() {
        const body = document.getElementById('auth-widget-body');
        const icon = document.getElementById('auth-widget-toggle-icon');
        if (body.style.display === 'none') {
          body.style.display = 'block';
          icon.innerText = '▼';
        } else {
          body.style.display = 'none';
          icon.innerText = '▲';
        }
      }

      // Функция авторизации
      async function loginWithBetterAuth(event) {
        const btn = event.target;
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;
        
        if (!email || !pass) return alert('Введи email и пароль!');

        const originalText = btn.innerText;
        btn.innerText = 'Загрузка...';
        btn.style.opacity = '0.7';

        try {
          const res = await fetch('/api/auth/sign-in/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: pass })
          });
          
          const data = await res.json();

          if (res.ok) {
            // Ищем токен
            const sessionToken = data.token || (data.session && data.session.token);
            
            if (sessionToken) {
              document.getElementById('auth-login-form').style.display = 'none';
              document.getElementById('auth-success-area').style.display = 'block';
              document.getElementById('auth-result-token').value = sessionToken;
            } else {
              alert('Авторизация прошла, но токен не найден в ответе. Проверь включен ли плагин bearer() в Better Auth.');
            }
          } else {
            alert(data.message || 'Ошибка авторизации');
            btn.innerText = '❌ Ошибка';
            btn.style.background = '#dc2626';
          }
        } catch (e) {
          alert('Ошибка сети');
          btn.innerText = '❌ Ошибка';
        }

        btn.style.opacity = '1';
        if (btn.innerText.includes('Ошибка')) {
          setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = '#2563eb';
          }, 2000);
        }
      }

      // Удобное копирование готового JSON для Headers
      function copyToken() {
        const token = document.getElementById('auth-result-token').value;
        const jsonString = '{\\n  "Authorization": "Bearer ' + token + '"\\n}';
        
        navigator.clipboard.writeText(jsonString).then(() => {
          const btn = event.target;
          const originalText = btn.innerText;
          btn.innerText = '✅ Скопировано!';
          btn.style.background = '#10b981';
          
          setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = '#0f172a';
          }, 2000);
        });
      }
    </script>
  </div>
`;
