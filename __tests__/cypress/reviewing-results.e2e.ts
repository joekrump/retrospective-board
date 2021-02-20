describe("Review flow", () => {
  it("can be toggled between review mode and normal mode", () => {
    cy.visit("/");
    cy.get("[data-cy=review-switch]").click();
    cy.get("[data-cy=sort-columns-button]").should("exist");

    cy.get("[data-cy=review-switch]").click();
    cy.get("[data-cy=sort-columns-button]").should("not.exist");
  });
});
