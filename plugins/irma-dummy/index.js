const merge = require('deepmerge');

module.exports = class IrmaDummy {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options      = this._sanitizeOptions(options);
  }

  stateChange({newState, payload}) {
    switch(newState) {
      case 'Loading':
        return this._startNewSession();
      case 'CheckingUserAgent':
        // A new transition cannot be started within stateChange, so add call to javascript event loop.
        switch(this._options.dummy) {
          case 'mobile':
            return Promise.resolve().then(() => this._stateMachine.transition('prepareButton'));
          default:
            return Promise.resolve().then(() => this._stateMachine.transition('prepareQRCode'));
        }
      case 'PreparingQRCode':
        return setTimeout(() => this._stateMachine.transition('showQRCode', {
          qr: JSON.stringify(this._options.qrPayload),
        }), this._options.timing.prepare);
      case 'PreparingIrmaButton':
        return setTimeout(() => this._stateMachine.transition('showIrmaButton', {
          mobile: JSON.stringify(this._options.qrPayload),
        }), this._options.timing.prepare);
      case 'ShowingQRCode':
        return this._waitForScanning();
      case 'Pairing':
        setTimeout(() => {
          if (this._options.pairingCode === payload.enteredPairingCode) {
            this._stateMachine.transition('appConnected');
          } else {
            this._stateMachine.transition('pairingRejected', payload);
          }
        }, this._options.timing.pairing);
        break;
      case 'ContinueOn2ndDevice':
        return this._waitForUserAction();
    }
  }

  start() {
    if ( this._options.debugging )
      console.log(`🧙🏼‍♂️ Initializing fake IRMA flow`);

    switch(this._options.dummy) {
      case 'browser unsupported':
        return this._stateMachine.transition('browserError', 'Browser not supported, need magic feature');
      default:
        return this._stateMachine.transition('initialize', {canRestart: true});
    }
  }

  close() {
    if (this._stateMachine.currentState() == 'Success') {
      return this._options.successPayload;
    }
  }

  _startNewSession() {
    setTimeout(() => {
      // Stop when already being in end state
      if (this._stateMachine.isEndState())
        return;

      switch(this._options.dummy) {
        case 'connection error':
          return this._stateMachine.transition('fail', new Error('Dummy connection error'));
        default:
          return this._stateMachine.transition('loaded', {sessionPtr: this._options.qrPayload});
      }
    }, this._options.timing.start);
  }

  _waitForScanning() {
    setTimeout(() => {
      // Stop when already being in end state
      if (this._stateMachine.isEndState())
        return;

      switch(this._options.dummy) {
        case 'pairing':
          return this._stateMachine.transition('appPairing', {pairingCode: this._options.pairingCode});
        case 'timeout':
          return this._stateMachine.transition('timeout');
        default:
          return this._stateMachine.transition('appConnected');
      }
    }, this._options.timing.scan);
  }

  _waitForUserAction() {
    setTimeout(() => {
      // Stop when already being in end state
      if (this._stateMachine.isEndState())
        return;

      switch(this._options.dummy) {
        case 'cancel':
          return this._stateMachine.transition('cancel');
        default:
          return this._stateMachine.transition('succeed');
      }
    }, this._options.timing.app);
  }

  _sanitizeOptions(options) {
    const defaults = {
      dummy: 'happy path',
      qrPayload: {
        message: 'Just be patient ;)'
      },
      successPayload: {
        disclosed: 'Some attributes'
      },
      pairingCode: '1234',
      timing: {
        start: 1000,
        prepare: 1000,
        scan: 2000,
        pairing: 500,
        app: 2000
      }
    };

    return merge(defaults, options);
  }

}
