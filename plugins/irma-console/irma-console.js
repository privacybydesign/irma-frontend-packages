const qrcode = require('qrcode-terminal');

module.exports = (askRetry, askPairingCode) => {
  return class IrmaConsole {

    constructor({stateMachine, options}) {
      this._stateMachine = stateMachine;
      this._options = options;
    }

    stateChange({newState, payload, isFinal}) {
      if (isFinal) return;
      switch(newState) {
        case 'Cancelled':
          return this._askRetry('Transaction cancelled.');
        case 'TimedOut':
          return this._askRetry('Transaction timed out.');
        case 'Error':
          return this._askRetry('An error occurred.');
        case 'ShowingQRCode':
          return this._renderQRcode(payload);
        case 'ShowingIrmaButton':
          const err = new Error('Mobile sessions cannot be performed in node');
          if (this._options.debugging) console.error(err);
          return this._stateMachine.transition('fail', err);
        case 'ContinueOn2ndDevice':
        case 'ContinueInIrmaApp':
          return console.log('Please follow the instructions in the IRMA app.');
        case 'Pairing':
          return this._askPairingCode(payload);
      }
    }

    _askPairingCode({pairingCode}) {
        let code = askPairingCode();
        if (code === pairingCode) {
          this._stateMachine.transition('pairingCompleted');
        } else if (askRetry("Wrong pairing code was entered.")) {
          this._askPairingCode(pairingCode);
        } else {
          this._askRetry("Pairing cancelled.")
        }
    }

    _askRetry(message) {
      if ( askRetry(message) )
        return this._stateMachine.transition('restart');
      this._stateMachine.transition('abort');
    }

    _renderQRcode(payload) {
      qrcode.generate(payload.qr);
    }

  }
};
