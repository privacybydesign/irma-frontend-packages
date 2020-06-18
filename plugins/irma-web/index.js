const DOMManipulations = require('./dom-manipulations');
const merge            = require('deepmerge');

module.exports = class IrmaWeb {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options      = this._sanitizeOptions(options);
    this._lastPayload  = null;

    this._dom = new DOMManipulations(
      document.querySelector(this._options.element),
      this._options,
      (t) => {
        // Check for validity of function to prevent errors when multiple events are cached.
        if (this._stateMachine.isValidTransition(t))
          this._stateMachine.transition(t, this._lastPayload);
      }
    );
  }

  stateChange(state) {
    const {newState, payload} = state;
    this._lastPayload = payload;

    this._dom.renderState(state);
    switch(newState) {
      case 'ShowingQRCode':
      case 'ShowingQRCodeInstead':
        this._dom.setQRCode(payload.qr);
        break;

      case 'ShowingIrmaButton':
        this._dom.setButtonLink(payload.mobile);
        break;
    }
  }

  _sanitizeOptions(options) {
    const defaults = {
      element:      '#irma-web-form',
      showHelper:   false,
      translations: require(`./translations/${options.language || 'nl'}`)
    };

    return merge(defaults, options);
  }

}
