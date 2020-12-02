const IrmaWeb          = require('@privacybydesign/irma-web');
const DOMManipulations = require('./dom-manipulations');
const merge            = require('deepmerge');

module.exports = class IrmaPopup {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options = this._sanitizeOptions(options);

    this._dom = new DOMManipulations(options.element, () => {
      if (this._popupClosedEarly) {
        this._popupClosedEarly();
      }
      stateMachine.abort();
    });

    this._irmaWeb = new IrmaWeb({
      stateMachine,
      options: {
        ...options,
        element: `#irma-popup-web-form`,
        showCloseButton: true
      }
    });
  }

  stateChange(state) {
    this._irmaWeb.stateChange(state);

    switch(state.newState) {
      case 'Loading':
        return this._dom.openPopup();
    }
  }

  close(isForced) {
    this._irmaWeb.close(isForced);
    if (!this._dom.isPopupActive())
      return;

    if (isForced)
      return this._dom.closePopup();

    // Delay closing pop-up so that the user can see the animation.
    return new Promise(resolve => {
      this._popupClosedEarly = resolve;
      window.setTimeout(() => {
        // Popup might already be closed in the meantime.
        if (this._dom.isPopupActive()) {
          this._dom.closePopup();
          resolve();
        }
      }, this._options.closePopupDelay)
    });
  }

  _sanitizeOptions(options) {
    const defaults = {
      closePopupDelay: 2000,
    };

    return merge(defaults, options);
  }

};
