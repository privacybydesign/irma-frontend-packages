if (typeof fetch === 'undefined') require('isomorphic-fetch');

module.exports = class SessionManagement {
  constructor(options) {
    this._options = options;
    this._mappings = {};
  }

  start() {
    // Handle case where start is disabled and qr and token are supplied directly
    if (!this._options.start) {
      Object.keys(this._options.mapping).forEach((val) => (this._mappings[val] = this._options.mapping[val]({})));

      return Promise.resolve(this._mappings);
    }

    // Start options are specified, so start a new session
    // eslint-disable-next-line compat/compat
    return fetch(this._options.start.url(this._options), this._options.start)
      .then((r) => {
        if (r.status !== 200)
          throw new Error(
            `Error in fetch: endpoint returned status other than 200 OK. Status: ${r.status} ${r.statusText}`
          );
        return r;
      })
      .then((r) => this._options.start.parseResponse(r))
      .then((r) => {
        // Execute all mapping functions using the received start response.
        Object.keys(this._options.mapping).forEach((val) => (this._mappings[val] = this._options.mapping[val](r)));

        return this._mappings;
      });
  }

  result() {
    if (!this._options.result) return Promise.resolve(this._mappings);

    // eslint-disable-next-line compat/compat
    return fetch(this._options.result.url(this._options, this._mappings), this._options.result)
      .then((r) => {
        if (r.status !== 200)
          throw new Error(
            `Error in fetch: endpoint returned status other than 200 OK. Status: ${r.status} ${r.statusText}`
          );
        return r;
      })
      .then((r) => this._options.result.parseResponse(r));
  }
};
