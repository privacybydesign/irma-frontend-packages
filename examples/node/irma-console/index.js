const IrmaCore = require('@privacybydesign/irma-core');
const Console = require('@privacybydesign/irma-console');
const Dummy = require('@privacybydesign/irma-dummy');

const util = require('util');

const irma = new IrmaCore({
  debugging: true,
  dummy: 'happy path',
});

irma.use(Console);
irma.use(Dummy);

irma
  .start()
  .then((result) =>
    console.log(
      'Successful disclosure! 🎉',
      util.inspect(result, { showHidden: false, depth: null, colors: true })
    )
  )
  .catch((error) => console.error("Couldn't do what you asked 😢", error));
