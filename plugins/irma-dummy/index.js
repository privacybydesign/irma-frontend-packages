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

  start(server, request) {
    if ( this._options.debugging )
      console.log(`🧙🏼‍♂️ Fake-requesting server '${server}' for request:\n`, request);

    switch(this._options.dummy) {
      case 'browser unsupported':
        return this._stateMachine.transition('browserError', 'Browser not supported, need magic feature');
      default:
        return this._stateMachine.transition('initialize');
    }
  }

  _startNewSession() {
    setTimeout(() => {
      switch(this._options.dummy) {
        case 'connection error':
          return this._stateMachine.transition('error');
        default:
          return this._stateMachine.transition('loaded', this._options.qr_code_payload);
      }
    }, 400);
  }

  _waitForScanning() {
    setTimeout(() => {
      switch(this._options.dummy) {
        case 'timeout':
          return this._stateMachine.transition('timeout');
        default:
          return this._stateMachine.transition('codeScanned');
      }
    }, 1000);
  }

  _waitForUserAction() {
    setTimeout(() => {
      switch(this._options.dummy) {
        case 'cancel':
          return this._stateMachine.transition('cancel');
        default:
          return this._stateMachine.transition('succeed', this._options.success_payload);
      }
    }, 1000);
  }

  _sanitizeOptions(options) {
    return Object.assign({
      dummy: 'happy path',
      qr_code_payload: {
        message: 'Just be patient ;)'
      },
      success_payload: {
        disclosed: 'Some attributes'
      }
    }, options);
  }

}
