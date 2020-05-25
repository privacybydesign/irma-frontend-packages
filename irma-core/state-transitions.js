/**
 * This file defines the states for the state machine, plus the different valid
 * transitions to other states from each state.
 *
 * The transition 'fail' is a special one, and will (also) be triggered if we
 * try to apply an invalid transition from that state.
 */

module.exports = {

  startState:       'Uninitialized',
  endStates:        ['BrowserNotSupported', 'Success', 'Ended', 'Cancelled', 'TimedOut', 'Error'],

  Uninitialized: {
    initialize:     'Loading',
    browserError:   'BrowserNotSupported',
    fail:           'Error'
  },

  Loading: {
    loaded:         'MediumContemplation',
    abort:          'Ended',
    fail:           'Error'
  },

  MediumContemplation: {
    showQRCode:     'ShowingQRCode',
    showIrmaButton: 'ShowingIrmaButton',
    abort:          'Ended',
    fail:           'Error'
  },

  ShowingQRCode: {
    appConnected:   'ContinueOn2ndDevice',
    timeout:        'TimedOut',
    switchFlow:     'ShowingIrmaButton',
    abort:          'Ended',
    fail:           'Error'
  },

  ContinueOn2ndDevice: {
    succeed:        'Success',
    cancel:         'Cancelled',
    restart:        'Loading',
    timeout:        'TimedOut',
    abort:          'Ended',
    fail:           'Error'
  },

  ShowingIrmaButton: {
    chooseQR:       'ShowingQRCodeInstead',
    switchFlow:     'ShowingQRCode',
    appConnected:   'ContinueInIrmaApp',
    abort:          'Ended',
    fail:           'Error',

    succeed:        'Success',   // We sometimes miss the appConnected transition
    cancel:         'Cancelled', // on iOS, that's why these transitions are here
    timeout:        'TimedOut'   // too. So we don't 'fail' to the Error state.
  },

  ShowingQRCodeInstead: {
    appConnected:   'ContinueOn2ndDevice',
    switchFlow:     'ShowingQRCode',
    restart:        'Loading',
    timeout:        'TimedOut',
    abort:          'Ended',
    fail:           'Error'
  },

  ContinueInIrmaApp: {
    succeed:        'Success',
    cancel:         'Cancelled',
    restart:        'Loading',
    timeout:        'TimedOut',
    abort:          'Ended',
    fail:           'Error'
  },

  // Possible end states
  Cancelled: {
    abort:          'Ended',
    restart:        'Loading'
  },

  TimedOut: {
    abort:          'Ended',
    restart:        'Loading'
  },

  Error: {
    abort:          'Ended',
    restart:        'Loading'
  },

  BrowserNotSupported: {},
  Success: {},
  Ended: {}

}
