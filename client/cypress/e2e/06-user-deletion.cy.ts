// describe('Users Page – Delete All Users', () => {
//
//   beforeEach(() => {
//     cy.session('admin-session', () => {
//       cy.loginAsAdmin(); // login once
//     });
//   });
//
//   it('Deletes all users one by one and logs out', () => {
//
//     cy.visit('/dashboard/profile/users'); // go directly to users page
//
//     const deleteAllUsers = (): Cypress.Chainable<null> => {
//
//       // grab all visible rows
//       return cy.get('table.directory-list__table tbody tr:visible').then($rows => {
//
//         if ($rows.length === 0) {
//           cy.log('✅ All users deleted');
//           return cy.wrap(null);
//         }
//
//         // scope to first visible row
//         cy.get('table.directory-list__table tbody tr:visible')
//           .first()
//           .within(() => {
//             cy.get('td.col-action img[alt="edit"]')
//               .should('be.visible')
//               .click({ force: true });
//           });
//
//         // click Delete User
//         cy.contains('button.btn-danger', 'Delete User')
//           .should('be.visible')
//           .click({ force: true });
//
//         // ✅ Wait for confirmation popup and click "Yes, Confirm"
//         cy.get('div.confirmation-popup_actions button')
//           .contains('Yes, Confirm')
//           .should('be.visible')
//           .click({ force: true });
//
//         // recurse again for next row
//         return deleteAllUsers();
//       });
//     };
//
//     // start recursive deletion
//     deleteAllUsers().then(() => {
//
//       // verify table is empty
//       cy.get('table.directory-list__table tbody tr:visible')
//         .should('have.length', 0);
//
//       // logout
//       cy.get('div.profile_category.profile_logout_icon').click({ force: true });
//       cy.contains('li.profile-item', 'Sign out').click({ force: true });
//
//       cy.get('input[name="username"]').should('exist');
//     });
//   });
//
// });
