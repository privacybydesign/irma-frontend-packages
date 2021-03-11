const qrcode = require('qrcode-terminal');

module.exports = (askRetry, askPairingCode) => {
  return class IrmaConsole {

    constructor({stateMachine, options}) {
      this._stateMachine = stateMachine;
      this._options = options;
    }

    stateChange({newState, transition, payload, isFinal}) {
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
          return this._stateMachine.selectTransition(({validTransitions}) => {
            if (validTransitions.includes('fail'))
              return { transition: 'fail', payload: err };
            throw err;
          });
        case 'ContinueOn2ndDevice':
        case 'ContinueInIrmaApp':
          return console.log('Please follow the instructions in the IRMA app.');
        case 'EnterPairingCode':
          return this._askPairingCode(transition != 'appPairing');
      }
    }

    _askPairingCode(askedBefore) {
      return this._stateMachine.selectTransition(({validTransitions, isEndState}) => {
        if (isEndState) return false;
        if (askedBefore && !askRetry("Wrong pairing code was entered.")) {
          let transition = validTransitions.includes('cancel') ? 'cancel' : 'abort';
          return { transition };
        }
        let enteredPairingCode = askPairingCode();
        return validTransitions.includes('codeEntered')
            ? { transition: 'codeEntered', payload: {enteredPairingCode} }
            : false;
      });
    }

    _askRetry(message) {
      return this._stateMachine.selectTransition(({validTransitions, isEndState}) => {
        if (isEndState) return false;
        let transition = validTransitions.includes('restart') && askRetry(message)
          ? 'restart'
          : 'abort';
        return { transition };
      });
    }

    _renderQRcode(payload) {
      qrcode.generate(payload.qr);
    }

  }
};
