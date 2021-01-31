describe("Participating in an active retro", () => {
  before(() => {
    cy.visit("/");
    cy.wait(1);
  });

  it("allows a card to added, edited, and have its column changed", () => {
    cy.get(".column [data-cy=add-card-button]")
      .first()
      .click()

    cy.get("#columns > div:nth-child(1) [data-cy=card-contents-textarea]")
      .click()
      .type("**Bold content** _italic content_ ![doggo image](https://cdn2.thedogapi.com/images/rkZRggqVX_1280.jpg)");
    cy.get("[data-cy=save-card-button]")
      .click();

    cy.get(".column").first().get(".card--list > .card-container:last-child > .card--content")
      .should("contain.html", "<strong>Bold content</strong>")
      .and("contain.html", "<em>italic content</em>")
      .and("contain.html", "<img alt=\"doggo image\" src=\"https://cdn2.thedogapi.com/images/rkZRggqVX_1280.jpg\">");

    cy.get(".column").first().get(".card--list .card-container:last-child [data-cy=edit-card-button]")
      .click()
    cy.get("[data-cy=card-contents-textarea]")
      .click()
      .type("more TEXT!");

    cy.get("[data-cy=save-card-button]")
      .click();

    cy.get(".column").first().get(".card--list > .card-container:last-child > .card--content").should("contain", "more TEXT!")

    cy.get("[data-cy=save-card-button]").should("not.exist");

    // TODO:
    // 1. Test that anyone who is not the owner of the card cannot edit it.
    //
    // 2. Test that drag and drop works
    // Example: https://github.com/cypress-io/cypress-example-recipes/blob/d5d97b09bb99ba96dd86c98ab03eb8d60574c8f6/examples/testing-dom__drag-drop/cypress/integration/drag_n_drop_spec.js
  });

  it("allows users to add and remove stars from cards", () => {
    // Star count on a card should not go less than 0.
    // Clicking on the star icon on a card adds 1 star

    // Clicking on the undo icon on a card removes 1 star that had been added by the user

    // A user cannot remove stars added by a different user.

    // Star pool for a user (remaining number of stars) should start at 10.
    // Star pool for a user should not go below 0.
  });

  it("columns can be added and edited", () => {
    // FIXME: add tests
  });

  it("allows the title of the retro to be updated", () => {
    // FIXME: add tests
  });
});
