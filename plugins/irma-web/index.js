const QRCode           = require('qrcode');
const DOMManipulations = require('./dom-manipulations');
const merge            = require('deepmerge');

module.exports = class IrmaWeb {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options      = this._sanitizeOptions(options);
    this._lastPayload  = null;

    this._dom = new DOMManipulations(
      document.querySelector(this._options.element),
      this._options.translations,
      (t) => this._stateMachine.transition(t, this._lastPayload)
    );
  }

  stateChange({newState, payload}) {
    this._lastPayload = payload;
    switch(newState) {
      case 'ShowingQRCode':
      case 'ShowingQRCodeInstead':
        this._dom.renderState(newState);
        QRCode.toCanvas(
          document.getElementById('irma-web-qr-canvas'),
          JSON.stringify(payload),
          {width: '230', margin: '1'}
        );
        break;

      case 'ShowingIrmaButton':
        this._dom.renderState(newState);
        document.getElementById('irma-web-button-link')
                .setAttribute('href', `https://irma.app/-/session#${encodeURIComponent(JSON.stringify(payload))}`);
        break;

      default:
        this._dom.renderState(newState);
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
