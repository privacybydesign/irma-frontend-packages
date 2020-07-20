const QRCode = require('qrcode');

module.exports = class DOMManipulations {

  constructor(element, options, clickCallback) {
    this._element         = element;
    this._translations    = options.translations;
    this._showHelper      = options.showHelper;
    this._showCloseButton = options.showCloseButton;
    this._clickCallback   = clickCallback;

    this._renderInitialState();
    this._attachClickHandler();
  }

  renderState(state) {
    let newPartial = this._stateToPartialMapping()[state.newState];
    if (!newPartial) throw new Error(`I don't know how to render '${state.newState}'`);
    this._renderPartial(newPartial);

    if ( state.isFinal ) {
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

  _attachClickHandler() {
    // Polyfill for Element.matches to fix IE11
    if (!Element.prototype.matches) {
      Element.prototype.matches = Element.prototype.msMatchesSelector ||
                                  Element.prototype.webkitMatchesSelector;
    }

    this._element.addEventListener('click', (e) => {
      if (e.target.matches('[data-irma-glue-transition]')) {
        this._clickCallback(e.target.getAttribute('data-irma-glue-transition'));
      }
    });
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
      <header class="irma-web-header ${this._showHelper ? 'irma-web-show-helper' : ''}">
        <p>${this._translations.header}</p>
        <section class="irma-web-helper">
          <p>${this._translations.helper}</p>
        </section>
        ${this._showCloseButton ? `
          <button class="irma-web-close"></button>
        ` : ''}
      </header>
      <section class="irma-web-content">
        <section class="irma-web-centered">
          ${content}
        </section>
      </section>
    `;
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
      <p class="irma-web-restart-button"><a data-irma-glue-transition="restart">${this._translations.back}</a></p>
    `;
  }

  _stateContinueInIrmaApp() {
    return `
      <!-- State: WaitingForUser -->
      <div class="irma-web-waiting-for-user-animation"></div>
      <p>${this._translations.app}</p>
      <p class="irma-web-restart-button"><a data-irma-glue-transition="restart">${this._translations.retry}</a></p>
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
