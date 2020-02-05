const ServerSession = require('./server-session');
const ServerState   = require('./server-state');
const merge         = require('deepmerge');

module.exports = class IrmaServer {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options      = this._sanitizeOptions(options);
    this._session      = new ServerSession(this._options.session);
  }

  stateChange({newState, payload}) {
    switch(newState) {
      case 'Loading':
        return this._startNewSession();
      case 'MediumContemplation':
        return this._startWatchingServerState(payload);
      case 'Success':
      case 'Error':
      case 'Timeout':
      case 'Cancelled':
      case 'Aborted':
        // Close state observer when being in an idle state
        if (this._serverState)
          this._serverState.close();
        break;
    }
  }

  start() {
    this._stateMachine.transition('initialize');
  }

  _startNewSession() {
    this._session.start()
    .then(qr => this._stateMachine.transition('loaded', qr))
    .catch(error => {
      if ( this._options.debugging )
        console.error("Error starting a new session on the server:", error);

      this._stateMachine.transition('fail');
    })
  }

  _startWatchingServerState(payload) {
    this._serverState = new ServerState(payload.u, this._options.state);

    try {
      this._serverState.observe(s => this._serverStateChange(s), e => this._serverHandleError(e));
    } catch (error) {
      if ( this._options.debugging )
        console.error("Error while starting observe server state: ", error);

      this._stateMachine.transition('fail');
    }
  }

  _serverHandleError(error) {
    if ( this._options.debugging )
      console.error("Error while observing server state: ", error);

    this._stateMachine.transition('fail');
  }

  _serverStateChange(newState) {
    if ( newState == 'CONNECTED' )
      return this._stateMachine.transition('appConnected');

    switch(newState) {
      case 'DONE':
        // What we hope will happen ;)
        return this._successStateReached();
      case 'CANCELLED':
        // This is a conscious choice by a user.
        this._stateMachine.transition('cancel');
        // If session cannot be restarted, abort the flow
        if (this._options.session.disableRestart)
          this._stateMachine.transition('abort', 'Session cancelled and no restart possible');
        break;

      case 'TIMEOUT':
        // This is a known and understood error. We can be explicit to the user.
        this._stateMachine.transition('timeout');
        // If session cannot be restarted, abort the flow
        if (this._options.session.disableRestart)
          this._stateMachine.transition('abort', 'Session timed out and no restart possible');
        break;
      default:
        // Catch unknown errors and give generic error message. We never really
        // want to get here.
        if ( this._options.debugging )
          console.error(`Unknown state received from server: '${newState}'. Payload:`, payload);

        return this._stateMachine.transition('fail');
    }
  }

  _successStateReached() {
    this._session.result()
    .then(result => this._stateMachine.transition('succeed', result))
    .catch(error => {
      if ( this._options.debugging )
        console.error("Error fetching session result from the server:", error);

      this._stateMachine.transition('fail');
    });
  }

  _sanitizeOptions(options) {
    const defaults = {
      session: {
        url: '',
        start: {
          url:          o => `${o.url}/session`,
          body:         null,
          method:       'POST',
          headers:      { 'Content-Type': 'application/json' },
          qrFromResult: r => r.sessionPtr
        },
        // Disable restart by default if a session pointer is already given to handle, but no method is specified
        // to start a new session.
        disableRestart: options.session.start === undefined && options.session.handle !== undefined,
        result: {
          url:          o => `${o.url}/session/${o.session.token}/result`,
          body:         null,
          method:       'GET',
          headers:      { 'Content-Type': 'application/json' }
        }
      },
      state: {
        debugging:  options.debugging,

        serverSentEvents: {
          url:        o => `${o.url}/statusevents`,
          timeout:    2000,
        },

        polling: {
          url:        o => `${o.url}/status`,
          interval:   500,
          startState: 'INITIALIZED'
        }
      }
    };

    return merge(defaults, options);
  }

}
