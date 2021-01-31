describe("Participating in an active retro", () => {
  before(() => {
    cy.visit("/");
  });

  it("allows a new card to be added to a column", () => {
    cy.get(".column [data-cy=add-card-button]")
      .first()
      .click();
    cy.get("[data-cy=card-contents-textarea]")
      .click()
      .type("**Bold content** _italic content_ ![doggo image](https://cdn2.thedogapi.com/images/rkZRggqVX_1280.jpg)");
    cy.get("[data-cy=save-card-button]").click();

    cy.get(".column").first().get(".card--list > .card-container:last-child > .card--content")
      .should("contain.html", "<strong>Bold content</strong>")
      .should("contain.html", "<em>italic content</em>")
      .should("contain.html", "<img alt=\"doggo image\" src=\"https://cdn2.thedogapi.com/images/rkZRggqVX_1280.jpg\">");
  });

  it("allows a card to be dragged and dropped to a new column by its owner", () => {

  });

  it("allows a card to be edited by its owner", () => {

  });

  it("prevents a card being edited by anyone other than its owner", () => {

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

  });

  it("allows the title of the retro to be updated", () => {

  });
});
