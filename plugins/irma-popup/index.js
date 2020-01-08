require('./styles.scss');

const IrmaWeb      = require('irma-web');
const merge        = require('deepmerge');

module.exports = class IrmaPopup {

  constructor({stateMachine, options}) {
    this._stateMachine = stateMachine;
    this._options = this._sanitizeOptions(options);

    this._ensurePopupInitialized();

    this._irmaWeb = new IrmaWeb({
      element:      '#irma-web-form',
      stateMachine: this._stateMachine,
      options:      this._options
    });
  }

  _ensurePopupInitialized() {
    this._overlayElement = window.document.getElementById('irma-overlay');

    if (!this._overlayElement) {
      // Element for irma-web plugin
      const irmaWebElement = document.createElement('section');
      irmaWebElement.setAttribute('class', 'irma-web-form irma-modal');
      irmaWebElement.setAttribute('id', 'irma-web-form');

      const cancelButton = document.createElement('button');
      cancelButton.setAttribute('id', 'irma-cancel-button');
      cancelButton.setAttribute('class', 'irma-web-button');
      cancelButton.addEventListener('click', this._hidePopup.bind(this));

      // Element to embed irma-web element to be able to center it
      const popupElement = document.createElement('div');
      popupElement.setAttribute('id', 'irma-popup');
      popupElement.appendChild(irmaWebElement);
      popupElement.appendChild(cancelButton);

      // Overlay element to grey out the rest of the page
      this._overlayElement = document.createElement('div');
      this._overlayElement.setAttribute('id', 'irma-overlay');
      this._overlayElement.appendChild(popupElement);

      document.body.appendChild(this._overlayElement);
      this.translatePopupElement('irma-cancel-button', 'Common.Cancel');
    }

    this._showPopup();
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

  _showPopup() {
    this._overlayElement.setAttribute('class', 'irma-show');
  }

  _hidePopup() {
    this._overlayElement.removeAttribute('class')
  }

  stateChange({newState, payload}) {
    this._irmaWeb.stateChange({newState, payload});

    switch(newState) {
      case 'Success':
      case 'Cancelled':
      case 'BrowserNotSupported':
        window.setTimeout(this._hidePopup.bind(this), 2000);
        break;
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
