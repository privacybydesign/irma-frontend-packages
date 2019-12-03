const jsonwebtoken = require('jsonwebtoken');

module.exports = function(settings, request) {
  // Set headers right, depending on security method
  request.headers = request.headers || {};

  switch(settings.method) {
    case 'token':
      request.headers['Content-Type'] = 'application/json';
      request.headers['Authorization'] = settings.key;
      break;
    case 'publickey':
    case 'hmac':
      request.headers['Content-Type'] = 'text/plain';
      break;
    default:
      throw('Unsupported authentication method');
  }

  // Sign body
  if ( settings.method == 'publickey' || settings.method == 'hmac' ) {
    request.body = _signSessionRequest(request.body, settings.method, settings.key, settings.name);
  } else {
    request.body = JSON.stringify(request.body);
  }

  return request;
}

function _signSessionRequest(request, method, key, name) {
  let type;
  let rrequest;
  if (request.type) {
    type = request.type;
    rrequest = { request };
  } else if (request.request) {
    type = request.request.type;
    rrequest = request;
  }

  if (type !== 'disclosing' && type !== 'issuing' && type !== 'signing')
    throw new Error('Not an IRMA session request');
  if (method !== 'publickey' && method !== 'hmac')
    throw new Error('Unsupported signing method');

  const subjects = { disclosing: 'verification_request', issuing: 'issue_request', signing: 'signature_request' };
  const fields = { disclosing: 'sprequest', issuing: 'iprequest', signing: 'absrequest' };
  const algorithm = method === 'publickey' ? 'RS256' : 'HS256';
  const jwtOptions = { algorithm, issuer: name, subject: subjects[type] };

  return jsonwebtoken.sign({[ fields[type] ] : rrequest}, key, jwtOptions);
}
