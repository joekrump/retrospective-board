Cypress.Commands.add('dragAndDrop', (subject, target) => {
  Cypress.log({
    name: 'DRAGNDROP',
    message: `Dragging element ${subject} to ${target}`,
    consoleProps: () => {
      return {
        subject: subject,
        target: target
      };
    }
  });

  cy.get(subject)
    .then(subject => {
      cy.wrap(subject)
        .trigger("dragstart", { force: true });
      cy.get(target)
        .trigger("dragenter", { force: true })
        .wait(500)
        .trigger("drop", { force: true });
    });
});