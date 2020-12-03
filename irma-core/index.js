const StateMachine = require('./state-machine');
const userAgent    = require('./user-agent');

module.exports = class IrmaCore {

  constructor(options) {
    this._modules = [];
    this._options = options || {};
    this._userAgent = userAgent();

    this._stateMachine = new StateMachine(this._options.debugging);
    this._stateMachine.addEventListener((s) => this._stateMachineListener(s));
  }

  use(mod) {
    this._modules.push(new mod({
      stateMachine: this._stateMachine,
      options:      this._options
    }));
  }

  start(...input) {
    if (this._options.debugging)
      console.log("Starting session with options:", this._options);

    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject  = reject;
      this._modules.filter(m => m.start)
                   .forEach(m => m.start(...input));
    });
  }

  abort() {
    if (this._options.debugging) console.log('🖥 Aborting session instance');
    this._stateMachine.abort();
  }

  _stateMachineListener({eventType, ...state}) {
    switch(eventType) {
      case 'prepare':
        return Promise.allSettled(
          this._modules.filter(m => m.prepareStateChange)
            .map(m => Promise.resolve(m.prepareStateChange(state)))
        );
      case 'change':
        this._modules.filter(m => m.stateChange)
          .forEach(m => m.stateChange(state));

        const {newState, payload, isFinal} = state;

        switch (newState) {
          case 'Success':
            this._close().then(result => {
              if (this._resolve) this._resolve(result);
            });
            break;
          case 'MediumContemplation':
            if (this._userAgentIsMobile())
              this._stateMachine.transition('showIrmaButton', this._getSessionUrls(payload.sessionPtr));
            else
              this._stateMachine.transition('showQRCode', this._getSessionUrls(payload.sessionPtr));
            break;
          default:
            if (isFinal) {
              this._close(false).then(result => {
                if (this._reject) result ? this._reject(result) : this._reject(newState);
              });
            }
            break;
        }
        return;
      case 'abort':
        return this._close(true).then(result => {
          if (this._reject) result ? this._reject(result) : this._reject('Aborted');
        });
    }
  }

  _close(isForced) {
    // If multiple plugins return a result, then return an array with results; the order in which
    // plugins are added with 'use' determines the index in the result array. Plugins that
    // do not return a result, have the result 'undefined' then.
    return Promise.all(
      this._modules.map(m => Promise.resolve(m.close ? m.close(isForced) : undefined)),
    )
      .then(returnValues => {
        const filtered = returnValues.filter(v => v !== undefined);
        return filtered.length > 1 ? returnValues : filtered[0];
      });
  }

  _userAgentIsMobile() {
    return this._userAgent =='Android' || this._userAgent == 'iOS';
  }

  _getSessionUrls(sessionPtr) {
    let json = JSON.stringify(sessionPtr);
    let universalLink = `https://irma.app/-/session#${encodeURIComponent(json)}`;
    let mobileLink;
    switch (this._userAgent) {
      case 'Android':
        // Universal links are not stable in Android webviews and custom tabs, so always use intent links.
        let intent = `Intent;package=org.irmacard.cardemu;scheme=irma;l.timestamp=${Date.now()}`;
        let fallback = `S.browser_fallback_url=${encodeURIComponent(universalLink)}`;
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

}
