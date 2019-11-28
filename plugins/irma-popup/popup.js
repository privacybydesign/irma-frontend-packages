// This file is an adaptation of the front-end part of `irmajs`
// https://github.com/privacybydesign/irmajs/blob/master/src/index.js

require('./assets/irma.scss');

const phonePng  = require('./assets/phone.png');
const popupHtml = require('./assets/popup.html');

module.exports = class Popup {

  constructor(translations, cancelFunction) {
    this._translations = translations;
    this._cancelFunction = cancelFunction;
  }

  translatePopup(type) {
    const sessionTypeMap = {
      disclosing: 'Verify',
      issuing: 'Issue',
      signing: 'Sign'
    };

    const sessionType = sessionTypeMap[type] || 'Verify';

    this.translatePopupElement('irma-cancel-button', 'Common.Cancel');
    this.translatePopupElement('irma-title', `${sessionType}.Title`);
    this.translatePopupElement('irma-text', `${sessionType}.Body`);
  }

  translatePopupElement(el, id) {
    window.document.getElementById(el).innerText = this.getTranslatedString(id);
  }

  getTranslatedString(id) {
    const parts = id.split('.');
    let res = this._translations;
    for (const part in parts) {
      if (res === undefined) break;
      res = res[parts[part]];
    }

    if (res === undefined) return '';
    else return res;
  }

  setupPopup(qr) {
    this.ensurePopupInitialized();
    this.translatePopup(qr.irmaqr);
    window.document.getElementById('irma-modal').classList.add('irma-show');
    const cancelbtn = window.document.getElementById('irma-cancel-button');
    cancelbtn.addEventListener('click', this._cancelFunction);
  }

  showConnected() {
    canvas = document.getElementById('modal-irmaqr');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = window.devicePixelRatio;
    const canvasSize = 230;
    const imgWidth = 79;
    const imgHeight = 150;
    canvas.width = canvasSize * scale;
    canvas.height = canvasSize * scale;
    ctx.scale(scale, scale);
    const img = new Image();
    img.onload = () => ctx.drawImage(img, (canvasSize-imgWidth)/2, (canvasSize-imgHeight)/2, imgWidth, imgHeight);
    img.src = phonePng;
  }

  closePopup() {
    if (!window.document.getElementById('irma-modal')) return;
    window.document.getElementById('irma-modal').classList.remove('irma-show');
  }

  ensurePopupInitialized() {
    if (window.document.getElementById('irma-modal')) return;

    const popup = window.document.createElement('div');
    popup.id = 'irma-modal';
    popup.innerHTML = popupHtml;
    window.document.body.appendChild(popup);

    const overlay = window.document.createElement('div');
    overlay.classList.add('irma-overlay');
    window.document.body.appendChild(overlay);

    // If we add these elements and then immediately add a css class to trigger our css animations,
    // adding the elements and the css classes get bundled up and executed simultaneously,
    // preventing the css animation from being shown. Accessing offsetHeight forces a reflow in between.
    // https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
    // https://stackoverflow.com/questions/21664940/force-browser-to-trigger-reflow-while-changing-css
    void(popup.offsetHeight); // void prevents Javascript optimizers from throwing away this line
  }

}
