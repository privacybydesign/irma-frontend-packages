if ( typeof fetch === 'undefined' )
  require('isomorphic-fetch');

module.exports = class ServerSession {

  constructor(options) {
    this._options = options;
  }

  start() {
    // Handle case where start is disabled and qr and token are supplied directly
    if (!this._options.start) {
      this._sessionPtr = this._options.mapping.sessionPtr();

      if (this._options.result)
        this._sessionToken = this._options.mapping.sessionToken();

      return Promise.resolve(this._sessionPtr);
    }

    // Start options are specified, so start a new session
    return fetch(this._options.start.url(this._options), this._options.start)
    .then(r => {
      if ( r.status != 200 )
        throw(`Error in fetch: endpoint returned status other than 200 OK. Status: ${r.status} ${r.statusText}`);
      return r;
    })
    .then(r => this._options.start.parseResponse(r))
    .then(r => {
      this._sessionPtr = this._options.mapping.sessionPtr(r);
      if (this._options.result)
        this._sessionToken = this._options.mapping.sessionToken(r);

      return this._sessionPtr;
    });
  }

  result() {
    if ( !this._options.result )
      return Promise.resolve();

    return fetch(this._options.result.url(this._options, this._sessionToken), this._options)
    .then(r => {
      if ( r.status != 200 )
        throw(`Error in fetch: endpoint returned status other than 200 OK. Status: ${r.status} ${r.statusText}`);
      return r;
    })
    .then(r => r.json());
  }

}
