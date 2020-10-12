if ( typeof fetch === 'undefined' )
  require('isomorphic-fetch');

module.exports = class ServerSession {

  constructor(options) {
    this._options = options;
    this._mappings = {};
  }

  start() {
    // Handle case where start is disabled and qr and token are supplied directly
    if (!this._options.start) {
      Object.keys(this._options.mapping).forEach(val =>
        this._mappings[val] = this._options.mapping[val]()
      );

      return Promise.resolve(this._mappings.sessionPtr);
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
      // Execute all mapping functions using the received start response.
      Object.keys(this._options.mapping).forEach(val =>
        this._mappings[val] = this._options.mapping[val](r)
      );

      return this._mappings.sessionPtr;
    });
  }

  result() {
    if ( !this._options.result )
      return Promise.resolve();

    return fetch(this._options.result.url(this._options, this._mappings), this._options.result)
    .then(r => {
      if ( r.status != 200 )
        throw(`Error in fetch: endpoint returned status other than 200 OK. Status: ${r.status} ${r.statusText}`);
      return r;
    })
    .then(r => this._options.result.parseResponse(r));
  }

}
