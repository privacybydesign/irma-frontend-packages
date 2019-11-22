const irmaConsole = require('./irma-console');

module.exports = irmaConsole(message =>
  window.confirm(`${message} Do you want to try again?`)
);
