const transitions = require('./state-transitions');

module.exports = class StateMachine {

  constructor(debugging) {
    this._state     = transitions.startState;
    this._debugging = debugging;
    this._listeners = [];
    this._inEndState = false;
    this._inTransition = false;
    this._disabledTransitions = [];
  }

  /* Deprecated
  currentState() {
    return this._state;
  } *

  /* Deprecated
  isEndState() {
    return this._inEndState;
  } */

  /* Deprecated
  isValidTransition(transition) {
    if (this._inEndState || this._disabledTransitions.includes(transition))
      return false;
    return transitions[this._state][transition] != undefined;
  } */

  addStateChangeListener(func) {
    this._listeners.push(func);
  }

  // TODO: Add docs
  transition(transition, payload) {
    return this._performTransition({transition, payload});
  }

  // TODO: Add docs
  finalTransition(transition, payload) {
    return this._performTransition({transition, payload, isFinal: true});
  }

  /**
   * Initiate a transition based on the current state of the state machine. As parameter a
   * callback function should be specified which should return the desired transition.
   * The callback function receives information about the current state as parameter.
   * In case you conclude you don't want to do a transition after all, you can return false.
   * In case you decide to do a transition, you return the following:
   * {
   *   transition: 'someTransition', // Required
   *   isFinal: false,               // Optional; default value is false
   *   payload: 'some'               // Optional; default value is undefined
   * }
   * @param selectCallback: ({state, validTransitions, inEndState}) => {...}
   * @returns Promise<void>, Promise is rejected when an invalid transition is chosen.
   */
  selectTransition(selectCallback) {
    // Don't use promise chaining to prevent race-conditions.
    return new Promise((resolve, reject) => {
      let selected = selectCallback({
        state: this._state,
        validTransitions: this._getValidTransitions(),
        inEndState: this._inEndState,
      });
      if (!selected) {
        return resolve();
      }
      try {
        this._performTransition(selected);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  _getValidTransitions() {
    let isEnabled = t => !this._disabledTransitions.includes(t);
    return Object.keys(transitions[this._state]).filter(isEnabled);
  }

  // This function is non-async by design, to prevent race conditions when two transitions are started simultaneously.
  _performTransition({transition, isFinal, payload}) {
    const oldState = this._state;
    if (this._inEndState)
      throw new Error(`State machine is in an end state. No transitions are allowed from ${oldState}.`);
    this._state = this._getNewState(transition, isFinal);

    if (this._debugging)
      console.debug(`🎰 State change: '${oldState}' → '${this._state}' (because of '${transition}')`);

    // State is also an end state when no transitions are available from that state. We exclude the
    // abort transition since abort is only intended to turn a non end state into an end state.
    this._inEndState = isFinal || this._getValidTransitions().filter(t => t != 'abort').length == 0;

    if (transition === 'initialize')
      this._disabledTransitions = payload.canRestart ? [] : ['restart'];

    if (transition === 'restart') {
      payload = {...payload, canRestart: true};
    }

    this._listeners.forEach(func => func({
      newState: this._state,
      oldState: oldState,
      transition: transition,
      isFinal: this._inEndState,
      payload: payload
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
