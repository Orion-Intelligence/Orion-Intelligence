describe('prod docs theme', () => {
  it('reports applied color mode', () => {
    const out: Record<string, unknown> = {};
    cy.visit('https://whitearrowtechnology.orionintelligence.org/documentation/app_docs/user_manual.html');
    cy.get('html', { timeout: 20000 }).should('exist');
    cy.document().then(d => {
      const h = d.documentElement;
      out.dataColorMode = h.getAttribute('data-color-mode');
      out.htmlClass = h.className;
      out.storedTheme = (() => { try { return window.localStorage._theme ?? null; } catch (e) { return 'blocked'; } })();
    });
    cy.window().then(w => {
      const b = w.document.body;
      out.bodyBg = w.getComputedStyle(b).backgroundColor;
      out.bodyColor = w.getComputedStyle(b).color;
      out.htmlBg = w.getComputedStyle(w.document.documentElement).backgroundColor;
      out.prefersDark = w.matchMedia('(prefers-color-scheme: dark)').matches;
    }).then(() => cy.writeFile('/tmp/theme.json', out));
  });
});
