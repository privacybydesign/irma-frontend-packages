const IrmaWeb          = require('@privacybydesign/irma-web');
const DOMManipulations = require('./dom-manipulations');
const merge            = require('deepmerge');

module.exports = class IrmaPopup {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options = this._sanitizeOptions(options);

    this._dom = new DOMManipulations(options.element, () => {
      if (!stateMachine.isEndState()) {
        stateMachine.transition('abort');
      } else if (this._popupClosedEarly) {
        this._popupClosedEarly();
        this._popupClosedEarly = null;
      }
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

  stateChange({newState, payload}) {
    this._irmaWeb.stateChange({newState, payload});

    switch(newState) {
      case 'Loading':
        return this._dom.openPopup();
      case 'Aborted':
        return this._dom.closePopup();
    }
  }

  close() {
    if (!this._dom.isPopupActive())
      return Promise.resolve();

    // Delay closing pop-up so that the user can see the animation.
    return new Promise(resolve => {
      this._popupClosedEarly = resolve;
      window.setTimeout(() => {
        if (this._popupClosedEarly) {
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
