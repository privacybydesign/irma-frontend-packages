const qrcode = require('qrcode-terminal');

module.exports = (askRetry) => {
  return class IrmaConsole {

    constructor({stateMachine}) {
      this._stateMachine = stateMachine;
    }

    stateChange({newState, payload}) {
      switch(newState) {
        case 'Cancelled':
          return this._askRetry('Transaction cancelled.');
        case 'TimedOut':
          return this._askRetry('Transaction timed out.');
        case 'Error':
          return this._askRetry('An error occured.');
        case 'ShowingQRCode':
          return this._renderQRcode(payload);
      }
    }

    _askRetry(message) {
      if ( askRetry(message) )
        this._stateMachine.transition('restart');
    }

    _renderQRcode(payload) {
      qrcode.generate(JSON.stringify(payload));
    }

  }
};
