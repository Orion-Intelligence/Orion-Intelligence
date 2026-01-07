describe('Users Page – Delete Users Sequentially', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Counts edit-profile buttons; if 0 stop else delete total times', () => {
    cy.visit('/dashboard/profile/users');

    cy.get('button[id="edit-profile"]').then($btns => {
      const total = $btns.length;
      if (total === 0) return;

      cy.wrap($btns[0])
        .scrollIntoView()
        .then($b => $b[0].click());

      for (let i = 0; i < total; i++) {
        cy.contains('button', 'Delete User')
          .should('exist')
          .scrollIntoView()
          .then($btn => $btn[0].click());

        cy.contains('div.confirmation-popup_actions button', 'Yes, Confirm')
          .should('exist')
          .scrollIntoView()
          .then($btn => $btn[0].click());

        cy.wait(1000);
      }
    });
  });
});
``
