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
        case 'ContinueOn2ndDevice':
        case 'ContinueInIrmaApp':
          return console.log('Please follow the instructions in the IRMA app.');
      }
    }

    _askRetry(message) {
      if ( askRetry(message) )
        this._stateMachine.transition('restart');
      this._stateMachine.transition('abort', 'Aborted by user');
    }

    _renderQRcode(payload) {
      qrcode.generate(JSON.stringify(payload));
    }

  }
};
