const QRCode = require('qrcode');

module.exports = class DOMManipulations {

  constructor(element, options, clickCallback, pairingCodeCallback) {
    this._element         = element;
    this._translations    = options.translations;
    this._showHelper      = options.showHelper;
    this._showCloseButton = options.showCloseButton;

    this._pairingCodeCheckingDelay = options.pairingCodeCheckingDelay;

    this._clickCallback       = clickCallback;
    this._pairingCodeCallback = pairingCodeCallback;

    this._renderInitialState();
    this._attachEventHandlers();
  }

  renderLoading() {
    this._renderPartial(this._stateLoading);
  }

  close() {
    this._renderPartial(() => '');
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

  _attachEventHandlers() {
    // Polyfill for Element.matches to fix IE11
    if (!Element.prototype.matches) {
      Element.prototype.matches = Element.prototype.msMatchesSelector ||
                                  Element.prototype.webkitMatchesSelector;
    }

    this._element.addEventListener('click', (e) => {
      if (e.target.matches('[data-irma-glue-transition]')) {
        this._clickCallback(e.target.getAttribute('data-irma-glue-transition'));
      } else if (e.target.matches('.irma-web-pairing-code')) {
        let firstInvalidField = e.target.querySelector('input:invalid');
        if (firstInvalidField) firstInvalidField.focus();
      }
    });

    this._element.addEventListener('keydown', (e) => {
      if (e.target.matches('.irma-web-pairing-code input')) {
        e.target.prevValue = e.target.value;
        if (e.key != 'Enter') e.target.value = '';
      }
    });

    this._element.addEventListener('keyup', (e) => {
      if (e.target.matches('.irma-web-pairing-code input')) {
        let prevField = e.target.previousElementSibling;
        if (prevField && e.key == 'Backspace' && e.target.value === e.target.prevValue) {
          prevField.value = '';
          prevField.focus();
        }
      }
    });

    this._element.addEventListener('input', (e) => {
      if (e.target.matches('.irma-web-pairing-code input')) {
        let nextField = e.target.nextElementSibling;
        if (!nextField || !e.target.checkValidity()) {
          e.target.form.querySelector('input[type=submit]').click();
        } else {
          nextField.focus();
        }
      }
    });

    this._element.addEventListener('focusin', (e) => {
      if (e.target.matches('.irma-web-pairing-code input')) {
        if (!e.target.value) {
          e.preventDefault();
          e.target.form.querySelector('input:invalid').focus();
        }
      }
    });

    this._element.addEventListener('submit', (e) => {
      if (e.target.className == 'irma-web-pairing-form') {
        e.preventDefault();
        let inputFields = e.target.querySelectorAll('.irma-web-pairing-code input');
        let enteredCode = Array.prototype.map.call(inputFields, f => {
          f.disabled = true;
          return f.value;
        }).join('');
        e.target.querySelector('.irma-web-pairing-loading-animation').style.visibility = 'visible';
        setTimeout(() => {
          if (document.body.contains(e.target)) {
            e.target.querySelector('.irma-web-pairing-loading-animation').style.visibility = 'hidden';
            if (!this._pairingCodeCallback(enteredCode)) {
              let textElement = e.target.firstElementChild;
              textElement.innerHTML = this._translations.pairingFailed(enteredCode);
              textElement.classList.add('irma-web-error');
              e.target.reset();
              inputFields.forEach(f => f.disabled = false);
              inputFields[0].focus();
            }
          }
        }, this._pairingCodeCheckingDelay);
      }
    });
  }

  _renderPartial(newPartial) {
    this._element
        .querySelector('.irma-web-content .irma-web-centered')
        .innerHTML = newPartial.call(this);

    // Focus on first input field if any is present.
    let firstInputField = this._element.querySelector('input');
    if (firstInputField)
      firstInputField.focus();
  }

  _stateToPartialMapping() {
    return {
      Uninitialized:        this._stateUninitialized,
      Loading:              this._stateLoading,
      MediumContemplation:  this._stateLoading,
      ShowingQRCode:        this._stateShowingQRCode,
      Pairing:              this._statePairing,
      ContinueOn2ndDevice:  this._stateContinueInIrmaApp,
      ShowingIrmaButton:    this._stateShowingIrmaButton,
      ShowingQRCodeInstead: this._stateShowingQRCodeInstead,
      ContinueInIrmaApp:    this._stateContinueInIrmaApp,
      Cancelled:            this._stateCancelled,
      TimedOut:             this._stateTimedOut,
      Error:                this._stateError,
      BrowserNotSupported:  this._stateBrowserNotSupported,
      Success:              this._stateSuccess,
    };
  }

  /** Container markup **/

  _irmaWebForm(content) {
    return `
      <div class="irma-web-header ${this._showHelper ? 'irma-web-show-helper' : ''}">
        <p>${this._translations.header}</p>
        <div class="irma-web-helper">
          <p>${this._translations.helper}</p>
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

  _statePairing() {
    return `
      <!-- State: Pairing -->
      <form class="irma-web-pairing-form">
        <p>${this._translations.pairing}</p>
        <div class="irma-web-pairing-code">
          <input inputmode="numeric" pattern="\\d" maxlength="1" required />
          <input inputmode="numeric" pattern="\\d" maxlength="1" required />
          <input inputmode="numeric" pattern="\\d" maxlength="1" required />
          <input inputmode="numeric" pattern="\\d" maxlength="1" required />
        </div>
        <input type="submit" style="display: none" />
        <div class="irma-web-pairing-loading-animation" style="visibility: hidden">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </div>
        <p><a data-irma-glue-transition="cancel">${this._translations.cancel}</a></p>
      </form>
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
