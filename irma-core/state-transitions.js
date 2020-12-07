/**
 * This file defines the states for the state machine, plus the different valid
 * transitions to other states from each state.
 *
 * The transition 'fail' is a special one, and will (also) be triggered if we
 * try to apply an invalid transition from that state.
 */

module.exports = {

  startState:       'Uninitialized',
  endStates:        ['BrowserNotSupported', 'Success', 'Aborted', 'Cancelled', 'TimedOut', 'Error'],

  Uninitialized: {
    initialize:     'Loading',              // Expected payload: {canRestart: true/false}
    browserError:   'BrowserNotSupported',  // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  Loading: {
    loaded:         'CheckingUserAgent',    // Expected payload: { sessionPtr, frontendAuth (if available) }
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  CheckingUserAgent: {
    prepareQRCode:  'PreparingQRCode',      // Expected payload: undefined
    prepareButton:  'PreparingIrmaButton',  // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  PreparingQRCode: {
    showQRCode:     'ShowingQRCode',        // Expected payload: {qr: <payload for in QRs>, showBackButton: true/false}
    timeout:        'TimedOut',             // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object
  },

  ShowingQRCode: {
    appConnected:   'ContinueOn2ndDevice',  // Expected payload: undefined
    appPairing:     'EnterPairingCode',     // Expected payload: frontend options
    timeout:        'TimedOut',             // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object
    checkUserAgent: 'CheckingUserAgent'     // Expected payload: undefined
  },

  EnterPairingCode: {
    codeEntered:    'Pairing',              // Expected payload: {enteredPairingCode: ...}
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object
  },

  Pairing: {
    pairingRejected:  'EnterPairingCode',     // Expected payload: frontend options
    appConnected:     'ContinueOn2ndDevice',  // Expected payload: undefined
    cancel:           'Cancelled',            // Expected payload: undefined
    timeout:          'TimedOut',             // Expected payload: undefined
    abort:            'Aborted',              // Expected payload: undefined
    fail:             'Error'                 // Expected payload: error object
  },

  ContinueOn2ndDevice: {
    succeed:        'Success',              // Expected payload: session result (if any)
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  PreparingIrmaButton: {
    showIrmaButton: 'ShowingIrmaButton',    // Expected payload: {mobile: <app link for launching the IRMA app>}
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object
  },

  ShowingIrmaButton: {
    chooseQR:       'PreparingQRCode',      // Expected payload: frontend options
    appConnected:   'ContinueInIrmaApp',    // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object
    checkUserAgent: 'CheckingUserAgent',    // Expected payload: undefined

    // We sometimes miss the appConnected transition
    // on iOS, that's why these transitions are here
    // too. So we don't 'fail' to the Error state.
    succeed:        'Success',              // Expected payload: session result (if any)
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut'              // Expected payload: undefined
  },

  ContinueInIrmaApp: {
    succeed:        'Success',              // Expected payload: undefined
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  // Possible end states
  Cancelled: {
    abort:          'Aborted',              // Expected payload: undefined
    restart:        'Loading'               // Expected payload: undefined
  },

  TimedOut: {
    abort:          'Aborted',              // Expected payload: undefined
    restart:        'Loading'               // Expected payload: undefined
  },

  Error: {
    abort:          'Aborted',              // Expected payload: undefined
    restart:        'Loading'               // Expected payload: undefined
  },

  BrowserNotSupported: {},
  Success: {},
  Aborted: {}

}
