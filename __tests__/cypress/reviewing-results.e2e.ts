describe("Review flow", () => {
  it("can be toggled between review mode and normal mode", () => {
    cy.visit("/");
    cy.get("[data-cy=review-switch]").click();
    cy.get("[data-cy=reviewing-header]").should("contain.text", "Reviewing");

    cy.get("[data-cy=review-switch]").click();
    cy.get("[data-cy=reviewing-header]").should("not.exist");
  });
});
