module.exports = () => {
  if ( typeof window === 'undefined' )
    return 'nodejs';

  // IE11 doesn't have window.navigator, test differently
  // https://stackoverflow.com/questions/21825157/internet-explorer-11-detection
  if (!!window.MSInputMethodContext && !!document.documentMode)
    return 'Desktop';

  if (/Android/i.test(window.navigator.userAgent))
    return 'Android';

  // https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)
    return 'iOS';

  // Neither Android nor iOS, assuming desktop
  return 'Desktop';
}
