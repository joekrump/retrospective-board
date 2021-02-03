// in cypress/support/index.d.ts
// load type definitions that come with Cypress module
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to drag a DOM element to another DOM element
     * @example cy.dragAndDrop(subject, target)
    */
    dragAndDrop(
      subject: string,
      target: string,
    ): Cypress.Chainable
  }
}
