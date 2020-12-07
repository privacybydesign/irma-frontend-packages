const transitions = require('./state-transitions');

module.exports = class StateMachine {

  constructor(debugging) {
    this._state     = transitions.startState;
    this._debugging = debugging;
    this._listeners = [];
    this._inEndState = false;
    this._disabledTransitions = [];
  }

  currentState() {
    return this._state;
  }

  isEndState() {
    return this._inEndState;
  }

  isValidTransition(transition) {
    if (this._inEndState || this._disabledTransitions.includes(transition))
      return false;
    return transitions[this._state][transition] != undefined;
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
    this._state = this._getNewState(transition, isFinal);

    if ( this._debugging )
      console.debug(`🎰 State change: '${oldState}' → '${this._state}' (because of '${transition}')`);

    // State is also an end state when no transitions are available from that state. We exclude the
    // abort transition since abort is only intended to turn a non end state into an end state.
    let isEnabled = t => !this._disabledTransitions.includes(t) && t != 'abort';
    this._inEndState = isFinal || Object.keys(transitions[this._state]).filter(isEnabled).length == 0;

    if (transition === 'initialize')
      this._disabledTransitions = payload.canRestart ? [] : ['restart'];

    if (transition === 'restart') {
      payload = {...payload, canRestart: true};
    }

    this._listeners.forEach(func => func({
      newState:   this._state,
      oldState:   oldState,
      transition: transition,
      isFinal:    this._inEndState,
      payload:    payload
    }));
  }

  _getNewState(transition, isFinal) {
    let newState = transitions[this._state][transition];
    let isDisabled = this._disabledTransitions.includes(transition);
    if (!newState || isDisabled) newState = transitions[this._state]['fail'];
    if (!newState) throw new Error(`Invalid transition '${transition}' from state '${this._state}' and could not find a "fail" transition to fall back on.`);
    if (isDisabled) throw new Error(`Transition '${transition}' was disabled in state '${this._state}'`)
    if (isFinal && !transitions.endStates.includes(newState))
      throw new Error(`Transition '${transition}' from state '${this._state}' is marked as final, but resulting state ${newState} cannot be an end state.`);
    return newState;
  }

}
