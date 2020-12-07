const StatusListener = require('./status-listener');
const merge          = require('deepmerge');
const userAgent      = require('./user-agent');

module.exports = class IrmaStateClient {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options      = this._sanitizeOptions(options);
    this._mappings     = {};
  }

  stateChange({newState, transition, payload}) {
    switch(newState) {
      case 'Loading':
        this._canRestart = payload.canRestart;
        break;
      case 'CheckingUserAgent':
        if (transition == 'loaded') {
          this._mappings = payload;
          this._pairingEnabled = false;
          this._startWatchingServerState(payload);
        }
        this._determineFlow();
        break;
      case 'PreparingQRCode':
        return this._updatePairingState(true)
          .then(() => this._stateMachine.transition('showQRCode', {
            qr: JSON.stringify(this._mappings.sessionPtr),
            showBackButton: transition == 'chooseQR',
          }));
      case 'PreparingIrmaButton':
        return this._updatePairingState(false)
          .then(() => this._stateMachine.transition('showIrmaButton', {
            mobile: this._getMobileUrl(this._mappings.sessionPtr),
          }));
      case 'Pairing':
        if (this._frontendOptions.pairingCode === payload.enteredPairingCode) {
          this._pairingCompleted();
        } else {
          this._stateMachine.transition('pairingRejected');
        }
        break;
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

  cancelSession(mappings) {
    if (!this._options.state.cancel)
      return Promise.resolve();
    return fetch(this._options.state.cancel.url(mappings), {method: 'DELETE'});
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
        this.cancelSession(this._mappings)
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
    switch(newState) {
      case 'PAIRING':
        if (this._stateMachine.isValidTransition('appPairing'))
          this._stateMachine.transition('appPairing', this._frontendOptions);
        return;
      case 'CONNECTED':
        if (this._stateMachine.isValidTransition('appConnected'))
          this._stateMachine.transition('appConnected');
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
  }

  _handleNoSuccess(transition, payload) {
    if (this._canRestart)
      return this._stateMachine.transition(transition, payload);
    this._stateMachine.finalTransition(transition, payload);
  }

  _updatePairingState(continueOnSecondDevice) {
    if (!this._options.state.pairing)
      return Promise.resolve();

    let shouldBeEnabled = continueOnSecondDevice && this._options.state.pairing.onlyEnableIf(this._mappings);
    // Skip the request when the pairing method is already set correctly.
    if (shouldBeEnabled === this._pairingEnabled) return Promise.resolve();

    if (!this._mappings.frontendAuth) {
      if (this._options.debugging)
        console.log('Pairing cannot be enabled, because no frontendAuth token is provided')
      return Promise.resolve();
    }
    this._pairingEnabled = shouldBeEnabled;

    // If pairing should be enabled, parse the pairing options struct.
    let options = shouldBeEnabled
      ? Object.keys(this._options.state.pairing).reduce(
          (acc, key) => {
            if (typeof this._options.state.pairing[key] !== 'function')
              acc[key] = this._options.state.pairing[key];
            return acc;
          },
          {},
        )
      : { pairingMethod: 'none' };
    return this._updateFrontendOptions(options)
      .catch(err => {
        if ( this._options.debugging )
          console.error('Error received while changing pairing state:', err);
        this._handleNoSuccess('fail', err);
      });
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

  _updateFrontendOptions(options) {
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

  _getMobileUrl(sessionPtr) {
    const json = JSON.stringify(sessionPtr);
    switch (this._userAgent) {
      case 'Android':
        // Universal links are not stable in Android webviews and custom tabs, so always use intent links.
        let intent = `Intent;package=org.irmacard.cardemu;scheme=irma;l.timestamp=${Date.now()}`;
        return `intent://qr/json/${encodeURIComponent(json)}#${intent};end`;
      case 'iOS':
        return `https://irma.app/-/session#${encodeURIComponent(json)}`;
      default:
        throw new Error('Device type is not supported.');
    }
  }

  _determineFlow() {
    this._userAgent = userAgent();
    switch (this._userAgent) {
      case 'Android':
      case 'iOS':
        return this._stateMachine.transition('prepareButton');
      default:
        return this._stateMachine.transition('prepareQRCode');
    }
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
          onlyEnableIf:   m => true,// m => m.sessionPtr['pairingRecommended'], TODO: Wait for irmago change
          completedUrl:   m => `${m.sessionPtr['u']}/frontend/pairingcompleted`
        },
      }
    };

    return merge(defaults, options);
  }

}
