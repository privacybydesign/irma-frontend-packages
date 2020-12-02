const DOMManipulations = require('./dom-manipulations');
const merge            = require('deepmerge');

module.exports = class IrmaWeb {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options      = this._sanitizeOptions(options);
    this._lastPayload  = null;

    this._dom = new DOMManipulations(
      document.querySelector(this._options.element),
      this._options,
      (t) => {
        // Check for validity of function to prevent errors when multiple events are cached.
        if (this._stateMachine.isValidTransition(t))
          this._stateMachine.transition(t, this._lastPayload);
      },
      (pairingCode) => {
        console.log(pairingCode, this._lastPayload);
        if (pairingCode === this._lastPayload.pairingCode) {
          this._stateMachine.transition('pairingCompleted');
          return true;
        }
        return false;
      }
    );

    this._addVisibilityListener();
  }

  prepareStateChange() {
    this._dom.renderLoading();
  }

  stateChange(state) {
    const {newState, payload} = state;
    this._lastPayload = payload;

    this._dom.renderState(state);
    switch(newState) {
      case 'ShowingQRCode':
      case 'ShowingQRCodeInstead':
        this._dom.setQRCode(payload.qr);
        break;

      case 'ShowingIrmaButton':
        this._dom.setButtonLink(payload.mobile);
        break;
    }
  }

  close(isForced) {
    this._removeVisibilityListener();
    if (isForced) this._dom.close();
  }

  _sanitizeOptions(options) {
    const defaults = {
      element:      '#irma-web-form',
      showHelper:   false,
      translations: require(`./translations/${options.language || 'nl'}`),
      pairingCodeCheckingDelay: 500
    };

    return merge(defaults, options);
  }

  _addVisibilityListener() {
    const onVisibilityChange = () => {
      this._stateMachine.onReady(() => {
        if (this._stateMachine.currentState() != 'TimedOut' || document.hidden) return;
        if (this._stateMachine.isValidTransition('restart')) {
          if (this._options.debugging) console.log('🖥 Restarting because document became visible');
          this._stateMachine.transition('restart');
        }
      });
    };
    const onFocusChange = () => {
      this._stateMachine.onReady(() => {
        if (this._stateMachine.currentState() != 'TimedOut') return;
        if (this._stateMachine.isValidTransition('restart')) {
          if (this._options.debugging) console.log('🖥 Restarting because window regained focus');
          this._stateMachine.transition('restart');
        }
      });
    };
    const onResize = () => {
      this._stateMachine.onReady(() => {
        if (this._stateMachine.isValidTransition('checkUserAgent'))
          this._stateMachine.transition('checkUserAgent', this._lastPayload);
      });
    };

    if ( typeof document !== 'undefined' && document.addEventListener )
      document.addEventListener('visibilitychange', onVisibilityChange);

    if ( typeof window !== 'undefined' && window.addEventListener ) {
      window.addEventListener('focus', onFocusChange);
      window.addEventListener('resize', onResize);
    }

    this._removeVisibilityListener = () => {
      if ( typeof document !== 'undefined' && document.removeEventListener )
        document.removeEventListener('visibilitychange', onVisibilityChange);
      if ( typeof window !== 'undefined' && window.removeEventListener ) {
        window.removeEventListener('focus', onFocusChange);
        window.removeEventListener('resize', onResize);
      }
    };
  }

}
