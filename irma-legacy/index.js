require('irma-css/dist/irma.css');

const IrmaCore      = require('irma-core');
const Server        = require('irma-server');
const ServerSession = require('irma-server/server-session');
const ServerState   = require('irma-server/server-state');
const Console       = require('irma-console');
const Popup         = require('irma-popup');
const QRCode        = require('qrcode');
const JWT           = require('jsonwebtoken');

const browser = typeof(window) !== 'undefined';

const SessionStatus = {
  Initialized: 'INITIALIZED', // The session has been started and is waiting for the client to connect (scan the QR)
  Connected:   'CONNECTED',   // The client has retrieved the session request, we wait for its response
  Cancelled:   'CANCELLED',   // The session is cancelled, possibly due to an error
  Done:        'DONE',        // The session has completed successfully
  Timeout:     'TIMEOUT',     // Session timed out
  Error:       'ERROR',       // Session resulted in an error
};

/* eslint-disable no-console */
const optionsDefaults = {
  language:          'en',               // Popup language when method === 'popup'
  resultJwt:         false,              // Retrieve signed session result from the irma server
  legacyResultJwt:   false,              // Retrieve legacy (i.e. irma_api_server compatible from /getproof) JWT format
};
/* eslint-enable no-console */

// Stores all sessions started by startSession such that we can improve the functionality of handleSession
const startedSessions = {};

function parseError(e) {
  if (e.newState !== 'Aborted')
    return e;

  switch (e.oldState) {
    case 'Error':
      return SessionStatus.Error;
    case 'TimedOut':
      return SessionStatus.Timeout;
    default:
      return SessionStatus.Cancelled;
  }
}

/**
 * Handle an IRMA session after it has been created at an irma server, given the QR contents
 * to be sent to the IRMA app. This function can (1) draw an IRMA QR, (2) wait for the phone to
 * connect, (3) wait for the session to complete, and (4) retrieve the session result afterwards
 * from the irma server.
 * Returns a promise that can return at any of these phases, depending on the options.
 * Compatible with both `irma server` cli and Go `irmaserver` library.
 * @param {Object} qr
 * @param {Object} options
 */
function handleSession(qr, options = {}) {
  return new Promise(
    (resolve, reject) => {
      const startedSession = startedSessions[qr];

      // Option url does not involve any session management, so return immediately
      if (options.method === 'url')
        return resolve(QRCode.toDataURL(JSON.stringify(qr)));

      let irmaCoreOptions = {
        session: {
          handle: qr,
          enableRestart: startedSession !== undefined,
        },
        debugging: false,
        detailedErrors: true,
        language:  options.language || optionsDefaults.language,
      };

      if (startedSession) {
        irmaCoreOptions.session.start = {
          ...startedSession.start,
          url: startedSession.start.url.bind(null, startedSession),
        };
      }

      if (options.server) {
        const jwtType = options.legacyResultJwt ? 'getproof' : 'result-jwt';
        const endpoint = options.resultJwt || options.legacyResultJwt ? jwtType : 'result';
        irmaCoreOptions.session.result = {
          url: () => `${options.server}/session/${options.token}/${endpoint}`,
          body: null,
          method: 'GET',
          headers: {'Content-Type': 'application/json'},
        };
      }

      const irmaCore = new IrmaCore(irmaCoreOptions);
      irmaCore.use(Server);

      switch (options.method) {
        case 'canvas':
          return reject(new Error('Method canvas is not supported anymore, please switch to popup mode or use irma-js-packages.'));
        case 'console':
          irmaCore.use(Console);
          break;
        case 'mobile':
          console.info('irmajs: the method mobile has been fully integrated in the option popup');
          // Fall through
        case 'popup':
        case undefined:
          if (!browser)
            return reject(new Error('Method popup is only available in browser environments'));
          irmaCore.use(Popup);
          break;
        default:
          return reject(new Error(`Specified method ${options.method} unknown`));
      }

      irmaCore.start()
        .then(resolve)
        .catch(e => reject(parseError(e)));
    }
  )
}

/**
 * Start an IRMA session at an irmaserver.
 * @param {string} server URL to irmaserver at which to start the session
 * @param {Object} request Session request
 * @param {string} method authentication method (supported: undefined, none, token, hmac, publickey)
 * @param {*} key API token or JWT key
 * @param {string} name name of the requestor, only for hmac and publickey mode
 */
function startSession(server, request, method, key, name) {
  let options = {
    url: server,
  };

  let jwt;
  if (method === 'publickey' || method === 'hmac')
    jwt = signSessionRequest(request, method, key, name);

  if (jwt || typeof request === 'string') {
    options.start = {
      url: o => `${o.url}/session`,
      body: jwt || request,
      method: 'POST',
      headers: {'Content-Type': 'text/plain'},
    };
  } else {
    options.start = {
      url: o => `${o.url}/session`,
      body: JSON.stringify(request),
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
    };
    if (method === "token") {
      options.start.headers['Authorization'] = key;
    } else if (method !== undefined && method !== 'none') {
      throw new Error(`Method ${method} is not supported right now`);
    }
  }

  const serverSession = new ServerSession({
    ...options,
    start: {
      ...options.start,
      qrFromResult: r => r,
    }
  });
  return serverSession.start()
    .then(r => {
      startedSessions[r.sessionPtr] = options;
      return r;
    });
}

/**
 * Sign a session request into a JWT, using the HMAC (HS256) or RSA (RS256) signing algorithm.
 * @param {Object} request Session request
 * @param {string} method authentication method (supported: undefined, none, token, hmac, publickey)
 * @param {*} key API token or JWT key
 * @param {string} name name of the requestor, only for hmac and publickey mode
 */
function signSessionRequest(request, method, key, name) {
  let rrequest;
  if (request.type || request['@context']) {
    rrequest = { request };
  } else if (request.request) {
    rrequest = request;
  }

  const subjects = { disclosing: 'verification_request', issuing: 'issue_request', signing: 'signature_request' };
  const subjectsContext = {
    'https://irma.app/ld/request/disclosure/v2': 'verification_request',
    'https://irma.app/ld/request/signature/v2' : 'signature_request',
    'https://irma.app/ld/request/issuance/v2'  : 'issue_request',
  };

  if (!subjects[rrequest.request.type] && !subjectsContext[rrequest.request['@context']])
    throw new Error('Not an IRMA session request');
  if (method !== 'publickey' && method !== 'hmac')
    throw new Error('Unsupported signing method');

  const fields = { 'verification_request': 'sprequest', 'issue_request': 'iprequest', 'signature_request': 'absrequest' };
  const algorithm = method === 'publickey' ? 'RS256' : 'HS256';
  const jwtOptions = { algorithm, issuer: name,
    subject: subjects[rrequest.request.type] || subjectsContext[rrequest.request['@context']]
  };

  return JWT.sign({[ fields[jwtOptions.subject] ] : rrequest}, key, jwtOptions);
}

/**
 * Poll the status URL of an IRMA server until it indicates that
 * the status is no longer Initialized, i.e. Connected or Done. Rejects
 * on other states (Cancelled, Timeout).
 * @param {string} url
 */
function waitConnected(url) {
  return waitStatus(url, SessionStatus.Initialized, [SessionStatus.Connected, SessionStatus.Done]);
}

/**
 * Poll the status URL of an IRMA server until it indicates that the status
 * has changed from Connected to Done. Rejects on any other state.
 * @param {string} url
 */
function waitDone(url) {
  return waitStatus(url, SessionStatus.Initialized, [SessionStatus.Done])
}

function waitStatus(url, startingState, waitForStates) {
  const serverState = new ServerState(url, {
    serverSentEvents: {
      url:        o => `${o.url}/statusevents`,
      timeout:    2000,
    },

    polling: {
      url:        o => `${o.url}/status`,
      interval:   500,
      startState: startingState
    }
  });
  return new Promise(
    (resolve, reject) => {
      serverState.observe((status) => {
        if (waitForStates.includes(status))
          return resolve(status);
      }, reject);
    }
  ).finally(() => serverState.close());
}

module.exports = {
  ServerSession,
  handleSession,
  startSession,
  signSessionRequest,
  waitConnected,
  waitDone,
};
