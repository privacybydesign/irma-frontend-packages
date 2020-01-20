require('irma-css/dist/irma.css');

const IrmaCore   = require('irma-core');
const IrmaWeb    = require('irma-web');
const Server     = require('irma-server');

window.irma = {
  core: null,

  new: options => {
    window.irma.core = new IrmaCore(options);
    window.irma.core.use(IrmaWeb);
    window.irma.core.use(Server);
  },

  start: (...input) =>
    window.irma.core ?
      window.irma.core.start(...input) :
      console.error('You need to instantiate IrmaCore first')
}
