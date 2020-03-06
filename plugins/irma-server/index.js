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
      case 'Cancelled':
      case 'TimedOut':
      case 'Error':
      case 'Success':
      case 'Ended':
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

      this._handleNoSuccess('fail');
    })
  }

  _startWatchingServerState(payload) {
    this._serverState = new ServerState(payload.u, this._options.state);

    try {
      this._serverState.observe(s => this._serverStateChange(s), e => this._serverHandleError(e));
    } catch (error) {
      if ( this._options.debugging )
        console.error("Observing server state could not be started: ", error);

      this._handleNoSuccess('fail');
    }
  }

  _serverHandleError(error) {
    if ( this._options.debugging )
      console.error("Error while observing server state: ", error);

    this._handleNoSuccess('fail');
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
        return this._handleNoSuccess('cancel');
      case 'TIMEOUT':
        // This is a known and understood error. We can be explicit to the user.
        return this._handleNoSuccess('timeout');
      default:
        // Catch unknown errors and give generic error message. We never really
        // want to get here.
        if ( this._options.debugging )
          console.error(`Unknown state received from server: '${newState}'. Payload:`, payload);

        return this._handleNoSuccess('fail');
    }
  }

  _successStateReached() {
    this._session.result()
    .then(result => this._stateMachine.transition('succeed', result))
    .catch(error => {
      if ( this._options.debugging )
        console.error("Error fetching session result from the server:", error);

      this._handleNoSuccess('fail');
    });
  }

  _handleNoSuccess(transition) {
    if (this._options.session.start)
      return this._stateMachine.transition(transition);
    this._stateMachine.finalTransition(transition);
  }

  _sanitizeOptions(options) {
    const defaults = {
      session: {
        url: '',
        start: {
          url:          o => `${o.url}/session`,
          body:          null,
          method:        'POST',
          headers:       { 'Content-Type': 'application/json' },
          parseResponse: r => r.json()
        },
        mapping: {
          sessionPtr:    r => r.sessionPtr,
          sessionToken:  r => r.token
        },
        result: {
          url:          (o, token) => `${o.url}/session/${token}/result`,
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
