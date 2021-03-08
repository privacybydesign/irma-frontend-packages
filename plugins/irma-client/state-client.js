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
        this._canRestart = transition == 'restart' || payload.canRestart;
        break;
      case 'CheckingUserAgent':
        if (transition == 'loaded') {
          this._mappings = payload;
          this._pairingEnabled = false;
          this._statusListener = new StatusListener(payload, this._options.state);
        } else {
          this._statusListener.close();
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
      case 'ShowingQRCode':
      case 'ShowingIrmaButton':
        this._startWatchingServerState(payload);
        break;
      case 'Pairing':
        if (this._frontendOptions.pairingCode === payload.enteredPairingCode) {
          this._pairingCompleted();
        } else {
          setTimeout(() => {
            // The state might have changed in Cancelled, TimedOut or Error while
            // waiting, so we have to check the validity of the transition.
            if (this._stateMachine.isValidTransition('pairingRejected'))
              this._stateMachine.transition('pairingRejected', payload);
          }, this._options.state.pairing.minCheckingDelay);
        }
        break;
      case 'PreparingResult':
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

  _startWatchingServerState() {
    // A new transition cannot be started within stateChange, so add call to javascript event loop.
    Promise.resolve().then(() =>
      this._statusListener.observe(s => this._serverStateChange(s), e => this._serverHandleError(e))
    ).catch((error) => {
      if ( this._options.debugging )
        console.error("Observing server state could not be started: ", error);

      this._handleNoSuccess('fail', error);
    });
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
        // We sometimes miss the appConnected transition
        // on iOS, that's why sometimes we have to do this one first.
        if (this._stateMachine.isValidTransition('appConnected'))
          this._stateMachine.transition('appConnected');
        return this._stateMachine.transition('prepareResult');
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

    // onlyEnableIf may return 'undefined', so we force conversion to boolean by doing a double negation (!!).
    let shouldBeEnabled = continueOnSecondDevice && !!this._options.state.pairing.onlyEnableIf(this._mappings);

    // Skip the request when the pairing method is correctly set already.
    if (shouldBeEnabled === this._pairingEnabled) return Promise.resolve();

    if (!this._mappings.frontendAuth) {
      console.warn('Pairing cannot be enabled, because no frontendAuth token is provided. This might be a security risk.')
      return Promise.resolve();
    }
    this._pairingEnabled = shouldBeEnabled;

    // If pairing should be enabled, parse the pairing options struct.
    let options = shouldBeEnabled
      ? { pairingMethod: this._options.state.pairing.pairingMethod }
      : { pairingMethod: 'none' };
    return this._updateFrontendOptions(options)
      .catch(err => {
        if ( this._options.debugging )
          console.error('Error received while updating pairing state:', err);
        this._handleNoSuccess('fail', err);
      });
  }

  _pairingCompleted() {
    let delay = new Promise(resolve => setTimeout(resolve, this._options.state.pairing.minCheckingDelay));
    let url = this._options.state.pairing.completedUrl(this._mappings);

    return fetch(url, {
      method: 'POST',
      headers: {'Authorization': this._mappings.frontendAuth}
    })
      .finally(() => delay)
      .catch(err => {
        if ( this._options.debugging )
          console.error('Error received while completing pairing:', err);
        this._handleNoSuccess('fail', err);
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
    const universalLink = `https://irma.app/-/session#${encodeURIComponent(json)}`;
    switch (this._userAgent) {
      case 'Android':
        // Universal links are not stable in Android webviews and custom tabs, so always use intent links.
        let intent = `Intent;package=org.irmacard.cardemu;scheme=irma;l.timestamp=${Date.now()}`;
        let fallback = `S.browser_fallback_url=${encodeURIComponent(universalLink)}`;
        return `intent://qr/json/${encodeURIComponent(json)}#${intent};${fallback};end`;
      case 'iOS':
        return universalLink;
      default:
        throw new Error('Device type is not supported.');
    }
  }

  _determineFlow() {
    this._userAgent = userAgent();
    // A new transition cannot be started within stateChange, so add call to javascript event loop.
    Promise.resolve().then(() => {
      switch (this._userAgent) {
        case 'Android':
        case 'iOS':
          if (this._stateMachine.isValidTransition('prepareButton'))
            this._stateMachine.transition('prepareButton');
          break;
        default:
          if (this._stateMachine.isValidTransition('prepareQRCode'))
            this._stateMachine.transition('prepareQRCode');
          break;
      }
    });
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
          requestContext: 'https://irma.app/ld/request/options/v1'
        },

        pairing: {
          onlyEnableIf:     m => m.sessionPtr['pairingHint'],
          completedUrl:     m => `${m.sessionPtr['u']}/frontend/pairingcompleted`,
          minCheckingDelay: 500,
          pairingMethod:    'pin'
        }
      }
    };

    return merge(defaults, options);
  }

}
