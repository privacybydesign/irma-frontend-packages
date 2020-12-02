const irmaConsole = require('./irma-console');
const prompt = require('prompt-sync')();

module.exports = irmaConsole(message => {
  const input = prompt(`⌨️ ${message} Do you want to try again? [Yn]`);
  return ['y', 'Y', ''].indexOf(input) >= 0;
}, () => prompt('Please enter the pairing code that your IRMA app currently shows: ')
);
