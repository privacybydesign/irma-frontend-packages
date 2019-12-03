const transitions = require('./state-transitions');

module.exports = class StateMachine {

  constructor(debugging) {
    this._state     = transitions.startState;
    this._debugging = debugging;
    this._listeners = [];
  }

  addStateChangeListener(func) {
    this._listeners.push(func);
  }

  transition(transition, payload) {
    const oldState = this._state;
    this._state    = this._getNewState(transition);

    if ( this._debugging )
      console.debug(`🎰 State change: '${oldState}' → '${this._state}' (because of '${transition}')`);

    this._listeners.forEach(func => func({
      newState:      this._state,
      oldState:      oldState,
      transition:    transition,
      payload:       payload,
      universalLink: payload ? 'https://irma.app/-/session#' + encodeURIComponent(JSON.stringify(payload)) : null,
    }));
  }

  _getNewState(transition) {
    let newState = transitions[this._state][transition];
    if (!newState) newState = transitions[this._state]['fail'];
    if (!newState) throw new Error(`Invalid transition '${transition}' from state '${this._state}' and could not find a "fail" transition to fall back on.`);
    return newState;
  }

}
