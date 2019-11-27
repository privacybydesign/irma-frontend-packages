const Popup        = require('./popup');
const QRCode       = require('qrcode');
const merge        = require('deepmerge');

module.exports = class IrmaLegacyPopup {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options = this._sanitizeOptions(options);

    this._popup = new Popup(
      this._options.translations,
      () => this._stateMachine.transition('cancel')
    );
  }

  stateChange({newState, payload}) {
    switch(newState) {
      case 'ShowingQRCode':
      case 'ShowingQRCodeInstead':
        this._popup.setupPopup(payload, this._options.language);
        return QRCode.toCanvas(
          document.getElementById('modal-irmaqr'),
          JSON.stringify(payload),
          {width: '230', margin: '1'}
        );
      case 'ContinueOn2ndDevice':
        return this._popup.showConnected();
      case 'Success':
      case 'Error':
      case 'Cancelled':
      case 'TimedOut':
        return this._popup.closePopup();
    }
  }

  _sanitizeOptions(options) {
    const defaults = {
      language: options.language || 'nl',
      translations: require(`./translations/${options.language || 'nl'}`)
    };

    return merge(defaults, options);
  }

};
