module.exports = class DOMManipulations {

  constructor(element, closeCallback) {
    this._closeCallback = closeCallback;
    this._element = this._findElement(element);

    this._element.classList.add('irma-web-popup');
    this._element.innerHTML = `<section class='irma-web-form' id='irma-popup-web-form'></section>`;
  }

  isPopupActive() {
    return this._element.classList.contains('irma-web-popup-active');
  }

  openPopup() {
    // Initialize event handlers
    let clickEventListener = e => this._clickHandler(e);
    let keyEventListener = e => this._keyHandler(e);
    this._element.addEventListener('click', clickEventListener);
    document.addEventListener('keyup', keyEventListener);
    this._removeEventListeners = () => {
      this._element.removeEventListener('click', clickEventListener);
      document.removeEventListener('keyup', keyEventListener);
    }

    this._element.classList.add('irma-web-popup-active');
    // Explicitly focus popup to prevent that buttons in underlying website stay in focus.
    this._element.focus();
  }

  closePopup() {
    if (this.isPopupActive()) {
      this._removeEventListeners();
      this._element.classList.remove('irma-web-popup-active');
    }
  }

  _findElement(element) {
    if ( element ) {
      const found = document.querySelector(element);
      if ( !found ) console.error(`Could not find element ${element}`);
      return found;
    }

    this._elementCreated = true;
    let createdElement = document.querySelector('div.irma-web-popup');
    if (!createdElement) {
      createdElement = document.body.appendChild(document.createElement('div'));
    }
    createdElement.setAttribute('tabindex', '-1'); // Make popup focusable
    return createdElement;
  }

  _clickHandler(e) {
    // Is this a click on the close button or the background overlay?
    if ( e.target.matches('button.irma-web-close') )
      this._cancel();
  }

  _keyHandler(e) {
    // Did we press the Escape key?
    if (e.key == 'Escape')
      this._cancel();
  }

  _cancel() {
    this.closePopup();
    this._closeCallback();
  }

}
