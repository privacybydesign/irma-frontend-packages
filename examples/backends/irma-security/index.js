const IrmaCore = require('irma-core');
const Console  = require('irma-console');
const Server   = require('irma-server');
const Security = require('irma-security');

const irma = new IrmaCore({
  debugging: true,

  session: {
    // Point this to your IRMA server:
    url: 'http://localhost:8088',

    // Define your disclosure request:
    start: Security(
      {
        // Use security token in headers
        method: 'token',
        key: 'g8df7g9f7h6g7',

        // // Sign the request using RS256
        // method: 'publickey',
        // key: 'dh897gh87fj76f9j6g',
        // name: 'Sender name',
        //
        // // Sign the request using HS256
        // method: 'hmac',
        // key: '76fgh65fj6757gsg',
        // name: 'Sender name'
      },
      {
        body: {
          "@context": "https://irma.app/ld/request/disclosure/v2",
          "disclose": [
            [
              [ "pbdf.pbdf.email.email" ]
            ]
          ]
        }
      }
    )
  }
});

irma.use(Console);
irma.use(Server);

irma.start()
.then(result => console.log("Successful disclosure! 🎉", result))
.catch(error => console.error("Couldn't do what you asked 😢", error));
