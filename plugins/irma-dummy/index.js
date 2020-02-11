const merge = require('deepmerge');

module.exports = class IrmaDummy {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options      = this._sanitizeOptions(options);
  }

  stateChange({newState}) {
    switch(newState) {
      case 'Loading':
        return this._startNewSession();
      case 'ShowingQRCode':
      case 'ShowingQRCodeInstead':
        return this._waitForScanning();
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
        return this._stateMachine.transition('initialize');
    }
  }

  _startNewSession() {
    setTimeout(() => {
      // Stop when already being in end state
      if (this._stateMachine.isEndState())
        return;

      switch(this._options.dummy) {
        case 'connection error':
          return this._stateMachine.transition('fail');
        default:
          return this._stateMachine.transition('loaded', this._options.qrPayload);
      }
    }, this._options.timing.start);
  }

  _waitForScanning() {
    setTimeout(() => {
      // Stop when already being in end state
      if (this._stateMachine.isEndState())
        return;

      switch(this._options.dummy) {
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
          return this._stateMachine.transition('succeed', this._options.successPayload);
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
      timing: {
        start: 1000,
        scan: 2000,
        app: 2000
      }
    };

    return merge(defaults, options);
  }

}
