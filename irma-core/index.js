const StateMachine = require('./state-machine');
const userAgent    = require('./user-agent');

module.exports = class IrmaCore {

  constructor(options) {
    this._modules = [];
    this._options = options || {};
    this._userAgent = userAgent();

    this._stateMachine = new StateMachine(this._options.debugging);
    this._stateMachine.addStateChangeListener((s) => this._stateChangeListener(s));

    this._addVisibilityListener();
  }

  use(mod) {
    this._modules.push(new mod({
      stateMachine: this._stateMachine,
      options:      this._options
    }));
  }

  start(...input) {
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject  = reject;
      this._modules.filter(m => m.start)
                   .forEach(m => m.start(...input));
    });
  }

  _stateChangeListener(state) {
    this._modules.filter(m => m.stateChange)
                 .forEach(m => m.stateChange(state));

    const {newState, payload, isFinal} = state;
    this._lastPayload = payload;

    switch(newState) {
      case 'Success':
        if ( this._resolve ) this._resolve(payload);
        this._removeVisibilityListener();
        break;
      case 'BrowserNotSupported':
      case 'Ended':
        if ( this._reject ) this._reject(payload);
        this._removeVisibilityListener();
        break;
      case 'MediumContemplation':
        if (this._userAgentIsMobile())
          this._stateMachine.transition('showIrmaButton', payload);
        else
          this._stateMachine.transition('showQRCode', payload);
        break;
      default:
        if ( isFinal ) {
          if ( this._reject ) this._reject(newState);
          this._removeVisibilityListener();
        }
        break;
    }
  }

  _userAgentIsMobile() {
    return this._userAgent == 'Android' || this._userAgent == 'iOS';
  }

  _addVisibilityListener() {
    const onVisibilityChange = () => {
      if (this._stateMachine.currentState() != 'TimedOut' || document.hidden) return;
      if (this._options.debugging) console.log('🖥 Restarting because document became visible');
      this._stateMachine.transition('restart');
    };
    const onFocusChange = () => {
      if ( this._stateMachine.currentState() != 'TimedOut' ) return;
      if ( this._options.debugging ) console.log('🖥 Restarting because window regained focus');
      this._stateMachine.transition('restart');
    };
    const onResize = () => {
      let newUserAgent = userAgent();
      if (this._userAgent !== newUserAgent) {
        if ( this._options.debugging ) console.log('🖥 Changing view because user agent changed on resize');
        this._userAgent = newUserAgent;

        switch (this._stateMachine.currentState()) {
          case 'ShowingQRCode':
            if (this._userAgentIsMobile())
              this._stateMachine.transition('switchFlow', this._lastPayload);
            break;
          case 'ShowingIrmaButton':
          case 'ShowingQRCodeInstead':
            if (!this._userAgentIsMobile())
              this._stateMachine.transition('switchFlow', this._lastPayload);
            break;
        }
      }
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
