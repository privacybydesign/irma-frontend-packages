const IrmaWeb          = require('@privacybydesign/irma-web');
const DOMManipulations = require('./dom-manipulations');
const merge            = require('deepmerge');

module.exports = class IrmaPopup {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options = this._sanitizeOptions(options);

    this._dom = new DOMManipulations(options.element, () => {
      if (!stateMachine.isEndState())
        stateMachine.transition('abort');
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
    // Delay closing pop-up so that the user can see the animation.
    return new Promise(resolve => window.setTimeout(() => {
      this._dom.closePopup();
      resolve();
    }, this._options.closePopupDelay));
  }

  _sanitizeOptions(options) {
    const defaults = {
      closePopupDelay: 2000,
    };

    return merge(defaults, options);
  }

};
