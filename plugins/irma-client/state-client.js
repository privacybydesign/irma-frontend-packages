const StatusListener = require('./status-listener');
const merge          = require('deepmerge');

module.exports = class IrmaStateClient {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options      = this._sanitizeOptions(options);
    this._mappings     = {};
  }

  prepareStateChange({newState, transition, payload}) {
    switch(newState) {
      case 'MediumContemplation':
        this._mappings = payload;
        this._frontendOptions = {};
        return this._updateFrontendOptions(this._getDefaultFrontendOptions());
      case 'ShowingQRCode':
      case 'ShowingQRCodeInstead':
        return this._updatePairingState(true);
      case 'ShowingIrmaButton':
        return this._updatePairingState(false);
      case 'ContinueOn2ndDevice':
        if (transition === 'pairingCompleted') {
          return this._pairingCompleted();
        }
        break;
    }
  }

  stateChange({newState, payload}) {
    switch(newState) {
      case 'Loading':
        this._canRestart = payload.canRestart;
        break;
      case 'MediumContemplation':
        this._pairingEnabled = false;
        return this._startWatchingServerState(payload);
      case 'Success':
      case 'Cancelled':
      case 'TimedOut':
      case 'Error':
        this._serverCloseSession();
        break;
    }
  }

  close() {
    this._serverCloseSession();
  }

  _startWatchingServerState(payload) {
    this._statusListener = new StatusListener(payload, this._options.state);

    try {
      this._statusListener.observe(s => this._serverStateChange(s), e => this._serverHandleError(e));
    } catch (error) {
      if ( this._options.debugging )
        console.error("Observing server state could not be started: ", error);

      this._handleNoSuccess('fail', error);
    }
  }

  _serverCloseSession() {
    if (this._statusListener) {
      if (this._statusListener.close()) {
        // If the server is still in an active state, we have to actively cancel.
        this._cancel()
          .catch(error => {
            if (this._options.debugging)
              console.error("Session could not be cancelled:", error);
          });
      }
    }
  }

  _serverHandleError(error) {
    if ( this._options.debugging )
      console.error("Error while observing server state: ", error);

    this._handleNoSuccess('fail', error);
  }

  _serverStateChange(newState) {
    this._stateMachine.onReady(() => {
      switch(newState) {
        case 'PAIRING':
          this._stateMachine.isValidTransition('appPairing')
            this._stateMachine.transition('appPairing', this._frontendOptions);
          return;
        case 'CONNECTED':
          if (this._stateMachine.isValidTransition('appConnected'))
            this._stateMachine.transition('appConnected', this._frontendOptions);
          return;
        case 'DONE':
          // What we hope will happen ;)
          this._statusListener.close();
          return this._stateMachine.transition('succeed');
        case 'CANCELLED':
          // This is a conscious choice by a user.
          this._statusListener.close();
          return this._handleNoSuccess('cancel');
        case 'TIMEOUT':
          // This is a known and understood error. We can be explicit to the user.
          this._statusListener.close();
          return this._handleNoSuccess('timeout');
        default:
          // Catch unknown errors and give generic error message. We never really
          // want to get here.
          if ( this._options.debugging )
            console.error('Unknown state received from server:', newState);

          this._statusListener.close();
          return this._handleNoSuccess('fail', new Error('Unknown state received from server'));
      }
    });
  }

  _handleNoSuccess(transition, payload) {
    if (this._canRestart)
      return this._stateMachine.transition(transition, payload);
    this._stateMachine.finalTransition(transition, payload);
  }

  _getDefaultFrontendOptions() {
    let {url, requestContext, ...defaultOptions} = this._options.state.frontendOptions;
    return defaultOptions;
  }

  _updatePairingState(continueOnSecondDevice) {
    if (!this._options.state.pairing)
      return Promise.resolve();

    let shouldBeEnabled = continueOnSecondDevice && this._options.state.pairing.onlyEnableIf(this._mappings);
    if (shouldBeEnabled === this._pairingEnabled)
      return Promise.resolve();

    let options = shouldBeEnabled
      ? Object.keys(this._options.state.pairing).reduce(
          (acc, key) => {
            if (typeof this._options.state.pairing[key] !== 'function')
              acc[key] = this._options.state.pairing[key];
            return acc;
          },
          {},
        )
      : { ...this._getDefaultFrontendOptions(), pairingMethod: 'none' };
    return this._updateFrontendOptions(options);
  }

  _pairingCompleted() {
    if (!this._options.state.pairing)
      return Promise.reject(new Error("Pairing was not enabled"));

    let url = this._options.state.pairing.completedUrl(this._mappings);

    return fetch(url, {
      method: 'POST',
      headers: {'Authorization': this._mappings.frontendAuth}
    });
  }

  _cancel() {
    if (!this._options.state.cancel)
      return Promise.resolve();
    return fetch(this._options.state.cancel.url(this._mappings), {method: 'DELETE'});
  }

  _updateFrontendOptions(options) {
    if (Object.keys(options).length === 0) return Promise.resolve();
    if (!this._mappings.frontendAuth) return Promise.reject(new Error('frontendAuth token was not supplied'));

    let req = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this._mappings.frontendAuth
      },
      body: JSON.stringify({
        '@context': this._options.state.frontendOptions.requestContext,
        ...options
      })
    };
    return fetch(this._options.state.frontendOptions.url(this._mappings), req)
      .then(r => r.json())
      .then(options => this._frontendOptions = options);
  }

  _sanitizeOptions(options) {
    const defaults = {
      state: {
        debugging:  options.debugging,

        serverSentEvents: {
          url:        m => `${m.sessionPtr['u']}/statusevents`,
          timeout:    2000,
        },

        polling: {
          url:        m => `${m.sessionPtr['u']}/status`,
          interval:   500,
          startState: 'INITIALIZED'
        },

        cancel: {
          url:        m => m.sessionPtr['u']
        },

        frontendOptions: {
          url:            m => `${m.sessionPtr['u']}/frontend/options`,
          requestContext: 'https://irma.app/ld/request/options/v1',
          // And all options that can be specified in an IRMA options request.
        },

        pairing: {
          pairingMethod:  'pin',
          onlyEnableIf:   m => m.frontendAuth, // && m.sessionPtr.irmaqr === 'issuing', // TODO: Check strictness.
          completedUrl:   m => `${m.sessionPtr['u']}/frontend/pairingcompleted`
        },
      }
    };

    return merge(defaults, options);
  }

}
