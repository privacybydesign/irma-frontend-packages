const transitions = require('./state-transitions');

module.exports = class StateMachine {

  constructor(debugging) {
    this._state     = transitions.startState;
    this._debugging = debugging;
    this._listeners = [];
    this._inEndState = false;
  }

  currentState() {
    return this._state;
  }

  isEndState() {
    return this._inEndState;
  }

  addStateChangeListener(func) {
    this._listeners.push(func);
  }

  transition(transition, payload) {
    this._performTransition(transition, false, payload)
  }

  finalTransition(transition, payload) {
    this._performTransition(transition, true, payload);
  }

  _performTransition(transition, isFinal, payload) {
    const oldState = this._state;
    if (this._inEndState)
      throw new Error(`State machine is in an end state. No transitions are allowed from ${oldState}.`);
    this._state    = this._getNewState(transition, isFinal);

    if ( this._debugging )
      console.debug(`🎰 State change: '${oldState}' → '${this._state}' (because of '${transition}')`);

    // State is also an end state when no transitions are available from that state
    this._inEndState = isFinal || Object.keys(transitions[this._state]).length == 0;

    this._listeners.forEach(func => func({
      newState:   this._state,
      oldState:   oldState,
      transition: transition,
      isFinal:    isFinal,
      payload:    payload
    }));
  }

  _getNewState(transition, isFinal) {
    let newState = transitions[this._state][transition];
    if (!newState) newState = transitions[this._state]['fail'];
    if (!newState) throw new Error(`Invalid transition '${transition}' from state '${this._state}' and could not find a "fail" transition to fall back on.`);
    if (isFinal && !transitions.endStates.includes(newState))
      throw new Error(`Transition '${transition}' from state '${this._state}' is marked as final, but resulting state ${newState} cannot be an end state.`);
    return newState;
  }

}
