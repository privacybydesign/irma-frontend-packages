require('./styles.css');

const IrmaWeb      = require('irma-web');
const merge        = require('deepmerge');

module.exports = class IrmaPopup {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options = this._sanitizeOptions(options);

    this._id = `${document.getElementsByClassName('irma-overlay').length}`;

    this._ensurePopupInitialized();

    this._irmaWeb = new IrmaWeb({
      stateMachine: this._stateMachine,
      options: {
        ...this._options,
        element: `#irma-web-form-${this._id}`,
      }
    });
  }

  _ensurePopupInitialized() {
    this._overlayElement = window.document.getElementById(`irma-overlay-${this._id}`);

    if (this._overlayElement)
      return;

    // Element for irma-web plugin
    const irmaWebElement = window.document.createElement('section');
    irmaWebElement.setAttribute('class', 'irma-web-form irma-modal');
    irmaWebElement.setAttribute('id', `irma-web-form-${this._id}`);

    const cancelButton = window.document.createElement('button');
    cancelButton.setAttribute('id', `irma-cancel-button-${this._id}`);
    cancelButton.setAttribute('class', 'irma-cancel-button irma-web-button');
    cancelButton.addEventListener('click', this._close.bind(this));

    // Element to embed irma-web element to be able to center it
    const popupElement = window.document.createElement('div');
    popupElement.setAttribute('class', 'irma-popup');
    popupElement.appendChild(irmaWebElement);
    popupElement.appendChild(cancelButton);

    // Overlay element to grey out the rest of the page
    this._overlayElement = window.document.createElement('div');
    this._overlayElement.setAttribute('class', 'irma-overlay');
    this._overlayElement.setAttribute('id', `irma-overlay-${this._id}`);
    this._overlayElement.appendChild(popupElement);

    window.document.body.appendChild(this._overlayElement);
    this.translatePopupElement(`irma-cancel-button-${this._id}`, 'cancel');
  }

  translatePopupElement(el, id) {
    window.document.getElementById(el).innerText = this.getTranslatedString(id);
  }

  getTranslatedString(id) {
    const parts = id.split('.');
    let res = this._options.translations;
    for (const part in parts) {
      if (res === undefined) break;
      res = res[parts[part]];
    }

    if (res === undefined) return '';
    else return res;
  }

  _close() {
    if (!this._stateMachine.isEndState())
      this._stateMachine.transition('abort', 'Popup closed');
    this._hidePopup();
  }

  _showPopup() {
    this._overlayElement.classList.add('irma-show');
  }

  _hidePopup() {
    if (this._overlayElement.parentElement)
      this._overlayElement.parentElement.removeChild(this._overlayElement);
  }

  stateChange({newState, payload}) {
    this._irmaWeb.stateChange({newState, payload});

    switch(newState) {
      case 'Loading':
        return this._showPopup();
      case 'Aborted':
      case 'Success':
      case 'BrowserNotSupported':
        // Delay auto-closure pop-up such that the user can see the animation
        return window.setTimeout(this._hidePopup.bind(this), 2000);
    }
  }

  _sanitizeOptions(options) {
    const defaults = {
      language: options.language || 'nl',
      translations: require(`./translations/${options.language || 'nl'}`)
    };

    return merge(defaults, options);
  }

};
