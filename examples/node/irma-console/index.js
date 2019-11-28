const IrmaCore = require('irma-core');
const Console  = require('irma-console');
const Dummy    = require('irma-dummy');

const irma = new IrmaCore({
  debugging: true,
  dummy: 'happy path'
});

irma.use(Console);
irma.use(Dummy);

irma.start('server_url', { request: 'content' })
.then(result => console.log("Successful disclosure! 🎉", result))
.catch(error => console.error("Couldn't do what you asked 😢", error));
