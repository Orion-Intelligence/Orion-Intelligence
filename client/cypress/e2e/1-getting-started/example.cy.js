describe('Orion Intelligence Dashboard Test', () => {
  it('Logs in and verifies dashboard functionality', () => {
    // Visit login page
    cy.visit('https://try.orionintelligence.org/login')

    // Enter credentials
    cy.get('input[name="username"]').type('admin')
    cy.get('input[name="password"]').type('cmUFD@CRw(MpYEj!)^rBhSAxk+HXWbu&#eGaq#ePysJNtgnV91')

    // Click Sign In
    cy.get('input.login-button').click()

    // Verify dashboard loaded
    cy.get('.dashboard_container', { timeout: 10000 }).should('exist')

    // Search something
    cy.get('input[name="q"]').type('search text')
    cy.get('button.default-input-button').click()

    // Verify number of results
    cy.get('.home-insight-card-container').then($cards => {
      const count = $cards.length
      cy.log(`Number of cards found: ${count}`)
      expect(count).to.be.greaterThan(0)
    })

    // Open each card and check "View Details" button
    cy.get('.home-insight-card-container').each($el => {
      cy.wrap($el).find('.home-insight-card-view-details-button').click()
      // Optionally add verification for details page
      cy.go('back') // go back to dashboard
    })

    // Check important buttons exist
    cy.get('.header-bar_profile').should('exist')
    cy.get('.sidebar_container').should('exist')
  })
})
