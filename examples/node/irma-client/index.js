const IrmaCore = require('@privacybydesign/irma-core');
const Console = require('@privacybydesign/irma-console');
const Client = require('@privacybydesign/irma-client');

const util = require('util');

const irma = new IrmaCore({
  debugging: true,

  session: {
    // Point this to your IRMA server:
    url: 'http://localhost:8088',

    // Define your disclosure request:
    start: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        '@context': 'https://irma.app/ld/request/disclosure/v2',
        disclose: [[['pbdf.pbdf.email.email'], ['pbdf.sidn-pbdf.email.email']]],
      }),
    },
  },
});

irma.use(Console);
irma.use(Client);

irma
  .start()
  .then((result) =>
    console.log('Successful disclosure! 🎉', util.inspect(result, { showHidden: false, depth: null, colors: true }))
  )
  .catch((error) => console.error("Couldn't do what you asked 😢", error));
