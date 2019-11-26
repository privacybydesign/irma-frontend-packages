require('./styles.scss');

const IrmaCore   = require('irma-core');
const IrmaWeb    = require('irma-web');
const Dummy      = require('irma-dummy');

const irma = new IrmaCore({
  debugging: true,
  element:   '#irma-web-form'
});

irma.use(IrmaWeb);
irma.use(Dummy);

irma.start('server_url', { request: 'content' })
.then(result => console.log("Successful disclosure! 🎉", result))
.catch(error => console.error("Couldn't do what you asked 😢", error));
