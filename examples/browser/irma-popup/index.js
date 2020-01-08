require('./styles.scss');

const IrmaCore = require('irma-core');
const Popup    = require('irma-popup');
const Dummy    = require('irma-dummy');

document.getElementById('start-button').addEventListener('click', () => {

  const irma = new IrmaCore({
    debugging: true,
    dummy:     'happy path',
    language:  'en',
    translations: {
      Cancel: 'Never mind!'
    }
  });

  irma.use(Popup);
  irma.use(Dummy);

  irma.start('server_url', { request: 'content' })
  .then(result => console.log("Successful disclosure! 🎉", result))
  .catch(error => console.error("Couldn't do what you asked 😢", error));

});
