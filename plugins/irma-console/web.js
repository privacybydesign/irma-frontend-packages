const irmaConsole = require('./irma-console');

module.exports = irmaConsole(
  (message) => window.confirm(`${message} Do you want to try again?`),
  () =>
    window.prompt(
      'Please enter the pairing code that your IRMA app currently shows:'
    )
);
