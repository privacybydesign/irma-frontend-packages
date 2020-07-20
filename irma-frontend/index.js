require('@privacybydesign/irma-css');

const IrmaCore   = require('@privacybydesign/irma-core');
const IrmaWeb    = require('@privacybydesign/irma-web');
const IrmaPopup  = require('@privacybydesign/irma-popup');
const IrmaClient = require('@privacybydesign/irma-client');

module.exports = {
  newWeb: options => {
    let core = new IrmaCore(options);
    core.use(IrmaWeb);
    core.use(IrmaClient);
    return {
      start: core.start.bind(core),
      abort: core.abort.bind(core),
    };
  },

  newPopup: options => {
    let core = new IrmaCore(options);
    core.use(IrmaPopup);
    core.use(IrmaClient);
    return {
      start: core.start.bind(core),
      abort: core.abort.bind(core),
    };
  },
}
