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
          this._stateMachine.transition('showIrmaButton', this._getSessionUrls(payload));
        else
          this._stateMachine.transition('showQRCode', this._getSessionUrls(payload));
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
    return this._userAgent.startsWith('Android') || this._userAgent == 'iOS';
  }

  _getSessionUrls(sessionPtr) {
    let json = JSON.stringify(sessionPtr);
    let universalLink = `https://irma.app/-/session#${encodeURIComponent(json)}`;
    let mobileLink;
    switch (this._userAgent) {
      case 'Android-Firefox':
        // The firefox app on Android does not automatically follow universal links, so use intent links there.
        let intent = `Intent;package=org.irmacard.cardemu;scheme=cardemu;l.timestamp=${Date.now()}`;
        let fallback = 'S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dorg.irmacard.cardemu';
        mobileLink =  `intent://qr/json/${encodeURIComponent(json)}#${intent};${fallback};end`;
        break;
      default:
        mobileLink = universalLink;
        break;
    }
    return {
      // TODO: When old IRMA app is phased out, also return universal link for QRs.
      qr: json,
      mobile: mobileLink,
    };
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
