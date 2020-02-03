if ( typeof fetch === 'undefined' )
  require('isomorphic-fetch');

module.exports = class ServerState {

  constructor(url, options) {
    this._eventSource = this._eventSource();
    this._running = false;
    this._options = options;
    this._options.url = url;
  }

  observe(stateChangeCallback, errorCallback) {
    this._stateChangeCallback = stateChangeCallback;
    this._errorCallback = errorCallback;

    if ( this._eventSource && this._options.serverSentEvents )
      return this._startSSE();

    this._startPolling();
  }

  close() {
    if ( this._source ) {
      this._source.close();
      if ( this._options.debugging )
        console.log("🌎 Closed EventSource");
    }

    this._source = null;
    this._running = false;
    // Reset callback function to make sure that pending events are not processed anymore
    this._stateChangeCallback = () => {};
  }

  _startSSE() {
    if ( this._options.debugging )
      console.log("🌎 Using EventSource for server events");

    this._source = new this._eventSource(this._options.serverSentEvents.url(this._options));

    const canceller = setTimeout(() => {
      if ( this._options.debugging )
        console.error(`🌎 EventSource could not connect within ${this._options.serverSentEvents.timeout}ms`);

      // Fall back to polling instead
      setTimeout(() => this._source.close(), 0); // Never block on this
      this._startPolling();
    }, this._options.serverSentEvents.timeout);

    this._source.addEventListener('open', () => clearTimeout(canceller));

    this._source.addEventListener('message', evnt => {
      clearTimeout(canceller);
      const state = JSON.parse(evnt.data);

      if ( this._options.debugging )
        console.log(`🌎 Server event: Remote state changed to '${state}'`);

      this._stateChangeCallback(state);
    });

    this._source.addEventListener('error', error => {
      clearTimeout(canceller);

      if ( this._options.debugging )
        console.error('🌎 EventSource threw an error: ', error);

      // Fall back to polling instead
      setTimeout(() => this._source.close(), 0); // Never block on this
      this._startPolling();
    });
  }

  async _startPolling() {
    if ( !this._options.polling || this._running )
      return;

    if ( this._options.debugging )
      console.log("🌎 Using polling for server events");

    let previousStatus = this._options.polling.startState;
    this._running = true;

    try {
      while( this._running ) {
        const status = await fetch(this._options.polling.url(this._options))
                             .then(r => {
                               if ( r.status != 200 )
                                 throw(`Error in fetch: endpoint returned status other than 200 OK. Status: ${r.status} ${r.statusText}`);
                               return r;
                             })
                             .then(r => r.json());

        if ( !this._running ) break;

        if ( status != previousStatus ) {
          if ( this._options.debugging )
            console.log(`🌎 Server event: Remote state changed to '${status}'`);

          previousStatus = status;
          this._stateChangeCallback(status);
        }

        await new Promise(resolve => setTimeout(resolve, this._options.polling.interval));
      }
    } catch(error) {
      if ( this._options.debugging )
        console.error("🌎 Error thrown while polling: ", error);
      this._errorCallback(error);
    }

    if ( this._options.debugging )
      console.log("🌎 Stopped polling");
  }

  _eventSource() {
    if ( typeof window == 'undefined' )
      return require('eventsource');
    else
      return window.EventSource;
  }

}
