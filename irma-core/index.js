const StateMachine = require('./state-machine');

module.exports = class IrmaCore {

  constructor(options) {
    this._modules = [];
    this._options = options || {};

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

    const {newState, isFinal} = state;

    if (isFinal) {
      let func = newState == 'Success' ? this._resolve : this._reject;
      this._close().then(result => {
        if ( func ) result ? func(result) : func(newState);
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

}
