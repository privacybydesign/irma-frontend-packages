const IrmaWeb          = require('irma-web');
const DOMManipulations = require('./dom-manipulations');

module.exports = class IrmaPopup {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;

    this._dom = new DOMManipulations(options.element, () => {
      if (!stateMachine.isEndState())
        stateMachine.transition('abort', 'Popup closed');
    });

    this._irmaWeb = new IrmaWeb({
      stateMachine,
      options: {
        ...options,
        element: `#irma-web-form`,
        showCloseButton: true
      }
    });
  }

  stateChange({newState, payload}) {
    this._irmaWeb.stateChange({newState, payload});

    switch(newState) {
      case 'Loading':
        return this._dom.openPopup();
      case 'Ended':
        return this._dom.closePopup();
    }

    // When being in a end state, delay closing pop-up so that the user can see the animation
    if (this._stateMachine.isEndState())
      return window.setTimeout(() => this._dom.closePopup(), 3000);
  }

};
