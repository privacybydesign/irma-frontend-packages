const SessionClient = require('./session-client');
const StateClient   = require('./state-client');

module.exports = class IrmaClient {

  constructor(args) {
    this._sessionClient = new SessionClient(args);
    this._stateClient = new StateClient(args);
  }

  prepareStateChange(args) {
    return this._stateClient.prepareStateChange(args);
  }

  stateChange(args) {
    this._sessionClient.stateChange(args);
    this._stateClient.stateChange(args);
  }

  start() {
    this._sessionClient.start();
  }

  close() {
    this._stateClient.close()
    return this._sessionClient.close();
  }

}
