const QRCode           = require('qrcode');
const DOMManipulations = require('./dom-manipulations');

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
      case 'ContinueInIrmaApp':
        return window.setTimeout(() => this._dom.renderState(newState), 200);
      case 'ShowingQRCode':
      case 'ShowingQRCodeInstead':
        this._dom.renderState(newState)
        return QRCode.toCanvas(
          document.getElementById('irma-web-qr-canvas'),
          JSON.stringify(payload),
          {width: '230', margin: '1'}
        );
      default:
        this._dom.renderState(newState)
    }
  }

  _sanitizeOptions(options) {
    return Object.assign({
      element:     '#irma-web-form',
      showHelper:  false,
      translations: {
        header:    'Inloggen met <i class="irma-web-logo">IRMA</i>',
        helper:    'Kom je er niet uit? Kijk dan eerst eens op <a href="https://irma.app/">de website van IRMA</a>.',
        loading:   'Eén moment alsjeblieft',
        button:    'Open IRMA app',
        qrCode:    'Toon QR code',
        app:       'Volg de instructies in de IRMA app',
        retry:     'Opnieuw proberen',
        back:      'Ga terug',
        cancelled: 'We hebben de attributen niet ontvangen. Het spijt ons, maar dan kunnen we je niet inloggen',
        timeout:   'Sorry! We hebben te lang<br/>niks van je gehoord',
        error:     'Sorry! Er is een fout opgetreden',
        browser:   'Het spijt ons, maar je browser voldoet niet aan de minimale eisen',
        success:   'Gelukt!'
      }
    }, options);
  }

}
