module.exports = class DOMManipulations {

  constructor(element, closeCallback) {
    this._closeCallback = closeCallback;
    this._elementCreated = false;
    this._element = this._findElement(element);

    this._element.classList.add('irma-web-popup');
    this._element.innerHTML = `<section class='irma-web-form' id='irma-popup-web-form'></section>`;

    let clickEventListener = e => this._clickHandler(e);
    let keyEventListener = e => this._keyHandler(e);
    this._element.addEventListener('click', clickEventListener);
    document.addEventListener('keyup', keyEventListener);
    document.addEventListener('keydown', keyEventListener);
    this._removeEventListeners = () => {
      this._element.removeEventListener('click', clickEventListener);
      document.removeEventListener('keyup', keyEventListener);
      document.removeEventListener('keydown', keyEventListener);
    }
  }

  isPopupActive() {
    return this._element.classList.contains('irma-web-popup-active');
  }

  openPopup() {
    this._element.classList.add('irma-web-popup-active');
  }

  closePopup() {
    this._element.classList.remove('irma-web-popup-active');
  }

  _findElement(element) {
    if ( element ) {
      const found = document.querySelector(element);
      if ( !found ) console.error(`Could not find element ${element}`);
      return found;
    }

    this._elementCreated = true;
    return document.querySelector('section.irma-web-popup') ||
           document.body.appendChild(document.createElement('section'));
  }

  _clickHandler(e) {
    // Is this a click on the close button or the background overlay?
    if ( e.target.matches('button.irma-web-close') )
      this._cancel();
  }

  _keyHandler(e) {
    // Prevent Enter from restarting the popup by hitting some button
    // below the popup.
    if ( e.key == 'Enter' )
      e.preventDefault();

    // Did we press the Escape key?
    if (e.type == 'keyup' && e.key == 'Escape')
      this._cancel();
  }

  _cancel() {
    this._removeEventListeners();
    this.closePopup();
    this._closeCallback();
  }

}
