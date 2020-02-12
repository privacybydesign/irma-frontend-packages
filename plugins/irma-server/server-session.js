if ( typeof fetch === 'undefined' )
  require('isomorphic-fetch');

module.exports = class ServerSession {

  constructor(options) {
    this._options = options;
  }

  start() {
    // Start explicit session if one is given, except if we know it has been started before.
    if ( this._options.handle && !this._options.session ) {
      this._options.session = {sessionPtr: this._options.handle};
      return Promise.resolve(this._options.handle);
    }

    // Check whether options are present to start a new session
    if (!this._options.start)
      throw('No options specified for starting new sessions');

    // start options are specified, so start a new session
    return fetch(this._options.start.url(this._options), this._options.start)
    .then(r => {
      if ( r.status != 200 )
        throw(`Error in fetch: endpoint returned status other than 200 OK. Status: ${r.status} ${r.statusText}`);
      return r;
    })
    .then(r => r.json())
    .then(r => {
      this._options.session = r;
      return this._options.start.qrFromResult(r);
    });
  }

  result() {
    if ( !this._options.result )
      return Promise.resolve();

    return fetch(this._options.result.url(this._options), this._options)
    .then(r => {
      if ( r.status != 200 )
        throw(`Error in fetch: endpoint returned status other than 200 OK. Status: ${r.status} ${r.statusText}`);
      return r;
    })
    .then(r => r.json());
  }

}
