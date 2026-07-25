'use strict';

fetch('/api/public', {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
})
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(response => {
            const appName = response?.settings?.app_name?.trim();
            if (appName) {
                  document.title = appName;
            }
      })
      .catch(() => {});
