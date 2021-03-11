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
  },

  Loading: {
    loaded:         'CheckingUserAgent',    // Expected payload: { sessionPtr, sessionToken (if present), frontendAuth (if present) }
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  CheckingUserAgent: {
    prepareQRCode:  'PreparingQRCode',      // Expected payload: undefined
    prepareButton:  'PreparingIrmaButton',  // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  PreparingQRCode: {
    showQRCode:     'ShowingQRCode',        // Expected payload: {qr: <payload for in QRs>, showBackButton: true/false}
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object
  },

  ShowingQRCode: {
    appConnected:   'ContinueOn2ndDevice',  // Expected payload: undefined
    appPairing:     'EnterPairingCode',     // Expected payload: frontend options
    cancel:         'Cancelled',            // Expected payload: undefined
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
    pairingRejected:  'EnterPairingCode',     // Expected payload: rejected codeEntered payload
    appConnected:     'ContinueOn2ndDevice',  // Expected payload: undefined
    cancel:           'Cancelled',            // Expected payload: undefined
    timeout:          'TimedOut',             // Expected payload: undefined
    abort:            'Aborted',              // Expected payload: undefined
    fail:             'Error'                 // Expected payload: error object
  },

  ContinueOn2ndDevice: {
    prepareResult:  'PreparingResult',      // Expected payload: undefined
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  PreparingIrmaButton: {
    showIrmaButton: 'ShowingIrmaButton',    // Expected payload: {mobile: <app link for launching the IRMA app>}
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object
  },

  ShowingIrmaButton: {
    chooseQR:       'PreparingQRCode',      // Expected payload: frontend options
    appConnected:   'ContinueInIrmaApp',    // Expected payload: undefined
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error',                // Expected payload: error object
    checkUserAgent: 'CheckingUserAgent',    // Expected payload: undefined
  },

  ContinueInIrmaApp: {
    prepareResult:  'PreparingResult',      // Expected payload: undefined
    cancel:         'Cancelled',            // Expected payload: undefined
    timeout:        'TimedOut',             // Expected payload: undefined
    abort:          'Aborted',              // Expected payload: undefined
    fail:           'Error'                 // Expected payload: error object
  },

  PreparingResult: {
    succeed:        'Success',              // Expected payload: result
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
