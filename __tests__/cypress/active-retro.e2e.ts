describe("Participating in an active retro", () => {

  function loginAsSession(sessionId: string): Function {
    const previousSessionId = sessionStorage.getItem("retroSessionId");
    sessionStorage.setItem("retroSessionId", sessionId);
    return function logInAsPreviousSession() {
      sessionStorage.setItem("retroSessionId", previousSessionId);
    };
  }

  before(() => {
    cy.visit("/");
    cy.wait(1000);
  });

  it("allows a card to added, edited, deleted, and have its column changed", () => {
    // Create
    cy.get(".column:nth-child(1) [data-cy=add-card-button]")
      .click()

    cy.get(".column:nth-child(1) [data-cy=card-contents-textarea]")
      .click()
      .type("**Bold content** _italic content_ ![doggo image](https://cdn2.thedogapi.com/images/rkZRggqVX_1280.jpg)");
    cy.get("[data-cy=save-card-button]")
      .click();

    cy.get(".column:nth-child(1) .card--list > .card-container:last-child > .card--content")
      .should("contain.html", "<strong>Bold content</strong>")
      .and("contain.html", "<em>italic content</em>")
      .and("contain.html", "<img alt=\"doggo image\" src=\"https://cdn2.thedogapi.com/images/rkZRggqVX_1280.jpg\">");

    // Edit
    cy.get(".column:nth-child(1) .card--list .card-container:last-child [data-cy=edit-card-button]")
      .invoke("show")
      .click()
    cy.get("[data-cy=card-contents-textarea]")
      .click()
      .type("more TEXT!");

    cy.get("[data-cy=save-card-button]")
      .click();

    cy.get(".column:nth-child(1) .card--list > .card-container:last-child > .card--content")
      .should("contain", "more TEXT!")

    cy.get("[data-cy=save-card-button]")
      .should("not.exist");

    cy.get(".column:nth-child(1) .card--list > .card-container:last-child [data-cy=add-star-button]")
      .then((starButton) => {
        // Max stars is 10 so this will attempt to add more stars than
        // allowed and verify that the remaining stars cannot go below 0.
        const numberOfClicks = 11;
        for(let i = 0; i < numberOfClicks; i++) {
          cy.wrap(starButton).click();
        }
      })
      .get(".user-stars")
      .should("contain.text", "10")
      .get(".stars-remaining")
      .should("contain.text", "⭐️: 0")
      .get("[data-cy=undo-star-button]")
      .click()
      .get(".user-stars")
      .should("have.text", "9") // verify that removing a star works.
      .get(".stars-remaining")
      .should("contain.text", "⭐️: 1")

    // Test that anyone who is not the owner of the card cannot edit it.
    // FIXME: this test fails when run in headless browser
    // const dummySessionId = "111111";
    // const undoPreviousSessionChange = loginAsSession(dummySessionId);
    // cy.visit("/");
    // cy.get(".column:nth-child(1) .card--list .card-container:last-child [data-cy=edit-card-button]")
    //   .should("not.exist");

    // undoPreviousSessionChange();

    cy.get(".column:nth-child(1) .card--list .card-container")
      .should("have.length", 1)
      .get(".column:nth-child(2) .card--list .card-container")
      .should("have.length", 0)

     // Test that drag and drop works
    const cardSelector = ".column:nth-child(1) .card--list .card-container:last-child";
    const columnDropTargetSelector = ".column:nth-child(2) .card--list";
    cy.dragAndDrop(cardSelector, columnDropTargetSelector)
      .get(".column:nth-child(2) .card--list .card-container")
      .should("have.length", 1)
      .get(".column:nth-child(1) .card--list .card-container")
      .should("have.length", 0)
      .get(".column:nth-child(2) .card--list .card-container .user-stars")
      .should("have.text", "9"); // Check that the star count after the drag and drop is the same as it was before it.

    // Delete
    cy.get(".column:nth-child(2) .card--list .card-container:last-child [data-cy=edit-card-button]")
      .invoke("show")
      .click()
      .get(".column:nth-child(2) .card--list .card-container:last-child [data-cy=delete-card-button]")
      .click()
      .get(".column:nth-child(2) .card--list .card-container")
      .should("have.length", 0)
      .get(".stars-remaining")
      .should("contain.text", "⭐️: 10"); // check that once a card is deleted, all the stars on it are returned.
  });

  it("columns can be added and edited", () => {
    // FIXME: add tests
  });

  it("allows the title of the retro to be updated", () => {
    // FIXME: add tests
  });
});
