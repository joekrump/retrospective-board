Cypress.Commands.add("dragAndDrop", (subject: string, target: string) => {
  Cypress.log({
    name: "DRAGNDROP",
    message: `Dragging element ${subject} to ${target}`,
    consoleProps: () => {
      return {
        subject,
        target,
      };
    }
  });

  return cy
    .get(subject)
    .trigger("dragstart")
    .get(target)
    .trigger("drop", { force: true });
});
