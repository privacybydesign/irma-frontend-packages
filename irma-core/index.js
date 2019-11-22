const StateMachine = require('./state-machine');
const userAgent    = require('./user-agent');

module.exports = class IrmaCore {

  constructor(options) {
    this._modules = [];
    this._options = options || {};
    this._options.userAgent = userAgent();

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

    const {newState, payload} = state;

    switch(newState) {
      case 'Success':
        if ( this._resolve ) this._resolve(payload);
        break;
      case 'BrowserNotSupported':
        if ( this._reject ) this._reject(payload);
        break;
      case 'ContinueInIrmaApp':
        if ( payload )
          return this._openIrmaApp(payload);
        if ( this._options.debugging )
          console.error("Tried to go to IRMA app without a payload");
        break;
      case 'MediumContemplation':
        if ( this._options.userAgent == 'Android' || this._options.userAgent == 'iOS' )
          this._stateMachine.transition('showIrmaButton', payload);
        else
          this._stateMachine.transition('showQRCode', payload);
        break;
    }
  }

  _openIrmaApp(payload) {
    const url = 'qr/json/' + encodeURIComponent(JSON.stringify(payload));

    switch(this._options.userAgent) {
      case 'Android':
        if ( this._options.debugging ) console.log("📱 Opening IRMA app on Android");
        return window.location.href = `intent://${url}#Intent;package=org.irmacard.cardemu;scheme=cardemu;l.timestamp=${Date.now()};S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dorg.irmacard.cardemu;end`;
      case 'iOS':
        if ( this._options.debugging ) console.log("📱 Opening IRMA app on iOS");
        return window.location.href = 'irma://' + url;
    }
  }

}
