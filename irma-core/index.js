const StateMachine = require('./state-machine');
const userAgent    = require('./user-agent');

module.exports = class IrmaCore {

  constructor(options) {
    this._modules = [];
    this._options = options || {};
    this._userAgent = userAgent();

    this._stateMachine = new StateMachine(this._options.debugging);
    this._stateMachine.addStateChangeListener((s) => this._stateChangeListener(s));
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
    if (this._stateMachine.currentState() != 'Uninitialized' && !this._stateMachine.isEndState()) {
      if (this._options.debugging) console.log('🖥 Manually aborting session instance');
      this._stateMachine.transition('abort');
    } else {
      if (this._options.debugging) console.log('🖥 Manual abort is not necessary');
    }
  }

  _stateChangeListener(state) {
    this._modules.filter(m => m.stateChange)
                 .forEach(m => m.stateChange(state));

    const {newState, payload, isFinal} = state;

    switch(newState) {
      case 'Success':
        this._close().then(result => {
          if ( this._resolve ) this._resolve(result);
        });
        break;
      case 'MediumContemplation':
        if (this._userAgentIsMobile())
          this._stateMachine.transition('showIrmaButton', this._getSessionUrls(payload));
        else
          this._stateMachine.transition('showQRCode', this._getSessionUrls(payload));
        break;
      default:
        if ( isFinal ) {
          this._close().then(result => {
            if ( this._reject ) result ? this._reject(result) : this._reject(newState);
          });
        }
        break;
    }
  }

  _close() {
    return this._modules.filter(m => m.close)
      .reduce(
        (prev, m) => prev.then(returnValues => m.close().then(res => {
          if (res) returnValues.push(res)
          return returnValues;
        })),
        Promise.resolve([])
      )
      .then(returnValues => returnValues.length > 1 ? returnValues : returnValues[0]);
  }

  _userAgentIsMobile() {
    return this._userAgent =='Android' || this._userAgent == 'iOS';
  }

  _getSessionUrls(sessionPtr) {
    let json = JSON.stringify(sessionPtr);
    let mobileLink;
    switch (this._userAgent) {
      case 'Android':
        // Universal links are not stable in Android webviews and custom tabs, so always use intent links.
        let intent = `Intent;package=org.irmacard.cardemu;scheme=irma;l.timestamp=${Date.now()}`;
        mobileLink =  `intent://qr/json/${encodeURIComponent(json)}#${intent};end`;
        break;
      default:
        mobileLink = `https://irma.app/-/session#${encodeURIComponent(json)}`;
        break;
    }
    return {
      // TODO: When old IRMA app is phased out, also return universal link for QRs.
      qr: json,
      mobile: mobileLink,
    };
  }

}
