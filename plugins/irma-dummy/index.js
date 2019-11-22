module.exports = class IrmaDummy {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options      = options;
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
          return this._stateMachine.transition('loaded', {'message': 'Just be patient ;)'});
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
          return this._stateMachine.transition('succeed', {disclosed: 'Some attributes'});
      }
    }, 1000);
  }

}
