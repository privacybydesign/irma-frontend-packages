const irma = require('irma-legacy');

document.getElementById('start-button').addEventListener('click', () => {

  const server = 'http://localhost:8088';
  const request = {
    '@context': 'https://irma.app/ld/request/disclosure/v2',
    'disclose': [[[ 'irma-demo.MijnOverheid.ageLower.over18' ]]]
  };

  irma.startSession(server, request)
      .then(({ sessionPtr, token }) => irma.handleSession(sessionPtr, {server, token}))
      .then(result => console.log('Done', result))
      .catch(e => console.log('Error', e));
});
