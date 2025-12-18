Cypress.Commands.add('takeStepScreenshot', (name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  cy.screenshot(`${name}-${timestamp}`, {
    capture: 'fullPage'
  })
})
