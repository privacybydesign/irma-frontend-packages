module.exports = class DOMManipulations {

  constructor(element, closeCallback) {
    this._closeCallback = closeCallback;
    this._element = this._findElement(element);

    this._element.classList.add('irma-web-popup');
    this._element.innerHTML = `<section class='irma-web-form' id='irma-popup-web-form'></section>`;

    let clickEventListener = e => this._clickHandler(e);
    let keyUpEventListener = e => this._keyHandler(e);
    this._element.addEventListener('click', clickEventListener);
    document.addEventListener('keyup', keyUpEventListener);
    this._removeEventListeners = () => {
      this._element.removeEventListener('click', clickEventListener);
      document.removeEventListener('keyup', keyUpEventListener);
    }

    this.closePopup();
  }

  openPopup() {
    this._element.classList.add('active');
  }

  closePopup() {
    this._element.classList.remove('active');
  }

  _findElement(element) {
    if ( element ) {
      const found = document.querySelector(element);
      if ( !found ) console.error(`Could not find element ${element}`);
      return found;
    }

    return document.querySelector('section.irma-web-popup') ||
           document.body.appendChild(document.createElement('section'));
  }

  _clickHandler(e) {
    // Is this a click on the close button or the background overlay?
    if ( e.target === this._element || e.target.matches('button.close') )
      this._cancel();
  }

  _keyHandler(e) {
    // Did we press the Escape key?
    if ( e.key == 'Escape' )
      this._cancel();
  }

  _cancel() {
    this._removeEventListeners();
    this.closePopup();
    this._closeCallback();
  }

}
