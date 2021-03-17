const QRCode = require('qrcode');

module.exports = class DOMManipulations {

  constructor(element, options, clickCallback) {
    this._element         = element;
    this._translations    = options.translations;
    this._showHelper      = options.showHelper;
    this._showCloseButton = options.showCloseButton;
    this._clickCallback   = clickCallback;
    this._eventHandlers   = {};

    this._renderInitialState();
    this._attachClickHandler();
  }

  renderState(state) {
    let newPartial = this._stateToPartialMapping()[state.newState];
    if (!newPartial) throw new Error(`I don't know how to render '${state.newState}'`);
    this._renderPartial(newPartial);

    if (state.oldState == 'ShowingIrmaButton') {
      this._element.querySelector('.irma-web-header').classList.remove('irma-web-show-helper');
      this._element.querySelector('.irma-web-helper').innerHTML = this._defaultHelperContent();
    }

    if ( state.isFinal ) {
      this._detachEventHandlers();
      // Make sure all restart buttons are hidden when being in a final state
      this._element.querySelectorAll('.irma-web-restart-button')
        .forEach(e => e.style.display = 'none');
    }
  }

  setQRCode(qr) {
    QRCode.toCanvas(
      this._element.querySelector('.irma-web-qr-canvas'),
      qr,
      {width: '230', margin: '1'}
    );
  }

  setButtonLink(link) {
    this._element.querySelector('.irma-web-button-link')
      .setAttribute('href', link);
  }

  _renderInitialState() {
    this._element.classList.add('irma-web-form');
    this._element.innerHTML = this._irmaWebForm(this._stateUninitialized());
  }

  _attachEventHandler(event, callback) {
    this._element.addEventListener(event, callback);
    this._eventHandlers[event] = callback;
  }

  _attachClickHandler() {
    // Polyfill for Element.matches to fix IE11
    if (!Element.prototype.matches) {
      Element.prototype.matches = Element.prototype.msMatchesSelector ||
                                  Element.prototype.webkitMatchesSelector;
    }

    this._attachEventHandler('click', (e) => {
      let isAndroid = /Android/i.test(window.navigator.userAgent);
      if (e.target.matches('[data-irma-glue-transition]')) {
        this._clickCallback(e.target.getAttribute('data-irma-glue-transition'));
      } else if (isAndroid && e.target.matches('.irma-web-button-link *')) {
        e.target.disabled = true;
        setTimeout(() => {
          // Only activate helper if the button to open the IRMA app is still present after the timeout.
          if (this._element.contains(e.target)) {
            this._element.querySelector('.irma-web-helper')
              .innerHTML = `<p>${this._translations.fallbackAndroid}</p>`;
            this._element.querySelector('.irma-web-header').classList.add('irma-web-show-helper');
            e.target.disabled = false;
          }
        }, 1000);
      }
    });
  }

  _detachEventHandlers() {
    Object.keys(this._eventHandlers).map((event) => {
      this._element.removeEventListener(event, this._eventHandlers[event]);
    });
    this._eventHandlers = {};
  }

  _renderPartial(newPartial) {
    this._element
        .querySelector('.irma-web-content .irma-web-centered')
        .innerHTML = newPartial.call(this);
  }

  _stateToPartialMapping() {
    return {
      Uninitialized:        this._stateUninitialized,
      Loading:              this._stateLoading,
      MediumContemplation:  this._stateLoading,
      ShowingQRCode:        this._stateShowingQRCode,
      ContinueOn2ndDevice:  this._stateContinueInIrmaApp,
      ShowingIrmaButton:    this._stateShowingIrmaButton,
      ShowingQRCodeInstead: this._stateShowingQRCodeInstead,
      ContinueInIrmaApp:    this._stateContinueInIrmaApp,
      Cancelled:            this._stateCancelled,
      TimedOut:             this._stateTimedOut,
      Error:                this._stateError,
      BrowserNotSupported:  this._stateBrowserNotSupported,
      Success:              this._stateSuccess,
      Aborted:              () => '',
    };
  }

  /** Container markup **/

  _irmaWebForm(content) {
    return `
      <div class="irma-web-header ${this._showHelper ? 'irma-web-show-helper' : ''}">
        <p>${this._translations.header}</p>
        <div class="irma-web-helper">
          ${this._defaultHelperContent()}
        </div>
        ${this._showCloseButton ? `
          <button class="irma-web-close"></button>
        ` : ''}
      </div>
      <div class="irma-web-content">
        <div class="irma-web-centered">
          ${content}
        </div>
      </div>
    `;
  }

  _defaultHelperContent() {
    return `<p>${this._translations.helper}</p>`;
  }

  /** States markup **/

  _stateUninitialized() {
    return `
      <!-- State: Uninitialized -->
      <div class="irma-web-loading-animation">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
      </div>
      <p>${this._translations.loading}</p>
    `;
  }

  _stateLoading() {
    return `
      <!-- State: Loading -->
      <div class="irma-web-loading-animation">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
      </div>
      <p>${this._translations.loading}</p>
    `;
  }

  _stateShowingQRCode() {
    return `
      <!-- State: ShowingQRCode -->
      <canvas class="irma-web-qr-canvas"></canvas>
    `;
  }

  _stateShowingIrmaButton() {
    return `
      <!-- State: ShowingButton -->
      <a class="irma-web-button-link">
        <button class="irma-web-button">${this._translations.button}</button>
      </a>
      <p><a data-irma-glue-transition="chooseQR">${this._translations.qrCode}</a></p>
    `;
  }

  _stateShowingQRCodeInstead() {
    return `
      <!-- State: ShowingQRCode -->
      <canvas class="irma-web-qr-canvas"></canvas>
      <p><a data-irma-glue-transition="showIrmaButton">${this._translations.back}</a></p>
    `;
  }

  _stateContinueInIrmaApp() {
    return `
      <!-- State: WaitingForUser -->
      <div class="irma-web-waiting-for-user-animation"></div>
      <p>${this._translations.app}</p>
      <p><a data-irma-glue-transition="cancel">${this._translations.cancel}</a></p>
    `;
  }

  _stateCancelled() {
    return `
      <!-- State: Cancelled -->
      <div class="irma-web-forbidden-animation"></div>
      <p>${this._translations.cancelled}</p>
      <p class="irma-web-restart-button"><a data-irma-glue-transition="restart">${this._translations.retry}</a></p>
    `;
  }

  _stateTimedOut() {
    return `
      <!-- State: TimedOut -->
      <div class="irma-web-clock-animation"></div>
      <p>${this._translations.timeout}</p>
      <p class="irma-web-restart-button"><a data-irma-glue-transition="restart">${this._translations.retry}</a></p>
    `;
  }

  _stateError() {
    return `
      <!-- State: Error -->
      <div class="irma-web-forbidden-animation"></div>
      <p>${this._translations.error}</p>
      <p class="irma-web-restart-button"><a data-irma-glue-transition="restart">${this._translations.retry}</a></p>
    `;
  }

  _stateBrowserNotSupported() {
    return `
      <!-- State: BrowserNotSupported -->
      <div class="irma-web-forbidden-animation"></div>
      <p>${this._translations.browser}</p>
    `;
  }

  _stateSuccess() {
    return `
      <!-- State: Success -->
      <div class="irma-web-checkmark-animation"></div>
      <p>${this._translations.success}</p>
    `;
  }

};
