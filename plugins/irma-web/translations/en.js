// prettier-ignore
module.exports = {
  header: 'Continue with <i class="irma-web-logo">IRMA</i>',
  helper: 'Can\'t figure it out?<br>Take a look at the <a href="https://irma.app/?lang=en">IRMA website</a>.',
  loading: 'Just a second please!',
  button: 'Open IRMA app',
  qrCode: 'Show QR code',
  app: 'Follow the steps in the IRMA app',
  retry: 'Try again',
  back: 'Go back',
  cancelled: 'The session is cancelled',
  timeout: 'Sorry! We haven\'t heard<br/>from you for too long',
  error: 'Sorry! Something went wrong',
  browser: 'We\'re sorry, but your browser does not meet the minimum requirements',
  success: 'Success!',
  cancel: 'Cancel',
  pairing: 'Enter the pairing code that your IRMA app currently shows.',
  pairingFailed: (code) => `The pairing code ${code} does not match the code in your IRMA app. Please try again.`
};
