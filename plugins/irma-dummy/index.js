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
            return Promise.resolve().then(() => this._doTransition('prepareButton'));
          default:
            return Promise.resolve().then(() => this._doTransition('prepareQRCode'));
        }
      case 'PreparingQRCode':
        return setTimeout(() => this._doTransition('showQRCode', {
          qr: JSON.stringify(this._options.qrPayload),
        }), this._options.timing.prepare);
      case 'PreparingIrmaButton':
        return setTimeout(() => this._doTransition('showIrmaButton', {
          mobile: JSON.stringify(this._options.qrPayload),
        }), this._options.timing.prepare);
      case 'ShowingQRCode':
        return this._waitForScanning();
      case 'Pairing':
        setTimeout(() => {
          if (this._options.pairingCode === payload.enteredPairingCode) {
            this._doTransition('appConnected');
          } else {
            this._doTransition('pairingRejected', payload);
          }
        }, this._options.timing.pairing);
        break;
      case 'ContinueOn2ndDevice':
        return this._waitForUserAction();
      case 'PreparingResult':
        return setTimeout(() => this._doTransition('succeed', this._options.successPayload),
            this._options.timing.prepare);
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

  _startNewSession() {
    setTimeout(() => {
      switch(this._options.dummy) {
        case 'connection error':
          return this._doTransition('fail', new Error('Dummy connection error'));
        default:
          return this._doTransition('loaded', {sessionPtr: this._options.qrPayload});
      }
    }, this._options.timing.start);
  }

  _doTransition(transition, payload) {
    if (this._stateMachine.isValidTransition(transition))
      return this._stateMachine.transition(transition, payload);
  }

  _waitForScanning() {
    setTimeout(() => {
      switch(this._options.dummy) {
        case 'pairing':
          return this._doTransition('appPairing', {pairingCode: this._options.pairingCode});
        case 'timeout':
          return this._doTransition('timeout');
        default:
          return this._doTransition('appConnected');
      }
    }, this._options.timing.scan);
  }

  _waitForUserAction() {
    setTimeout(() => {
      switch(this._options.dummy) {
        case 'cancel':
          return this._doTransition('cancel');
        default:
          return this._doTransition('prepareResult');
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
