const ServerSession = require('./session-management');
const merge         = require('deepmerge');

module.exports = class IrmaSessionClient {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options      = this._sanitizeOptions(options);
    this._session      = this._options.session ? new ServerSession(this._options.session) : false;
  }

  stateChange({newState, payload}) {
    if (newState == 'Loading') {
      this._canRestart = payload.canRestart;
      return this._startNewSession();
    }
  }

  start() {
    if (this._options.session) {
      this._stateMachine.transition('initialize', {
        canRestart: ![undefined, null, false].includes(this._options.session.start),
      });
    }
  }

  close() {
    if (this._stateMachine.currentState() == 'Success')
      return this._closingSuccessState();
  }

  _startNewSession() {
    if (this._session) {
      this._session.start()
        .then(mappings => {
          if (this._stateMachine.currentState() == 'Loading') {
            this._stateMachine.transition('loaded', mappings);
          } else {
            return fetch(mappings.sessionPtr['u'], {method: 'DELETE'});
          }
        })
        .catch(error => {
          if (this._options.debugging)
            console.error("Error starting a new session on the server:", error);
          this._stateMachine.transition('fail', error);
        })
    }
  }

  _closingSuccessState() {
    if (this._session) {
      return this._session.result()
        .catch(error => {
          if (this._options.debugging)
            console.error("Error fetching session result from the server:", error);

          this._stateMachine.transition('fail', error);
        });
    }
    return Promise.resolve();
  }

  _sanitizeOptions(options) {
    const defaults = {
      session: {
        url: '',
        start: {
          url:          o => `${o.url}/session`,
          parseResponse: r => r.json()
          // And default custom settings for fetch()'s init parameter
          // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
        },
        mapping: {
          sessionPtr:    r => r.sessionPtr,
          sessionToken:  r => r.token,
          frontendAuth:  r => r.frontendAuth
        },
        result: {
          url:           (o, {sessionToken}) => `${o.url}/session/${sessionToken}/result`,
          parseResponse: r => r.json()
          // And default custom settings for fetch()'s init parameter
          // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
        }
      }
    };

    return merge(defaults, options);
  }

}
