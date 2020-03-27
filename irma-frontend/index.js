require('@privacybydesign/irma-css/dist/irma.css');

const IrmaCore   = require('@privacybydesign/irma-core');
const IrmaWeb    = require('@privacybydesign/irma-web');
const IrmaClient = require('@privacybydesign/irma-client');

window.irma = {
  core: null,

  new: options => {
    window.irma.core = new IrmaCore(options);
    window.irma.core.use(IrmaWeb);
    window.irma.core.use(IrmaClient);
  },

  start: (...input) =>
    window.irma.core ?
      window.irma.core.start(...input) :
      console.error('You need to instantiate IrmaCore first')
}
