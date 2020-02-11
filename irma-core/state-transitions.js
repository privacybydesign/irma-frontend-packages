/**
 * This file defines the states for the state machine, plus the different valid
 * transitions to other states from each state.
 *
 * The transition 'fail' is a special one, and will (also) be triggered if we
 * try to apply an invalid transition from that state.
 */

module.exports = {

  startState:       'Uninitialized',

  Uninitialized: {
    initialize:     'Loading',
    browserError:   'BrowserNotSupported',
    fail:           'Error'
  },

  Loading: {
    loaded:         'MediumContemplation',
    abort:          'Aborted',
    fail:           'Error'
  },

  MediumContemplation: {
    showQRCode:     'ShowingQRCode',
    showIrmaButton: 'ShowingIrmaButton',
    abort:          'Aborted',
    fail:           'Error'
  },

  ShowingQRCode: {
    appConnected:   'ContinueOn2ndDevice',
    timeout:        'TimedOut',
    abort:          'Aborted',
    fail:           'Error'
  },

  ContinueOn2ndDevice: {
    succeed:        'Success',
    cancel:         'Cancelled',
    restart:        'Loading',
    timeout:        'TimedOut',
    abort:          'Aborted',
    fail:           'Error'
  },

  ShowingIrmaButton: {
    chooseQR:       'ShowingQRCodeInstead',
    appConnected:   'ContinueInIrmaApp',
    abort:          'Aborted',
    fail:           'Error',

    succeed:        'Success',   // We sometimes miss the appConnected transition
    cancel:         'Cancelled', // on iOS, that's why these transitions are here
    timeout:        'TimedOut'   // too. So we don't 'fail' to the Error state.
  },

  ShowingQRCodeInstead: {
    appConnected:   'ContinueOn2ndDevice',
    restart:        'Loading',
    timeout:        'TimedOut',
    abort:          'Aborted',
    fail:           'Error'
  },

  ContinueInIrmaApp: {
    succeed:        'Success',
    cancel:         'Cancelled',
    restart:        'Loading',
    timeout:        'TimedOut',
    abort:          'Aborted',
    fail:           'Error'
  },

  Cancelled: {
    abort:          'Aborted',
    restart:        'Loading'
  },

  TimedOut: {
    abort:          'Aborted',
    restart:        'Loading'
  },

  Error: {
    abort:          'Aborted',
    restart:        'Loading'
  },

  // End states
  BrowserNotSupported: {},
  Success: {},
  Aborted: {}

}
