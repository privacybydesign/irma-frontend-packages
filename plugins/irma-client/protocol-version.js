module.exports = class {
  static _parse(str) {
    const split = str.split('.').map((x) => parseInt(x));
    if (split.length !== 2) throw new Error('Length does not match');
    return {
      major: split[0],
      minor: split[1],
    };
  }

  /**
   * Checks whether version x is above version y
   * @param {string} x
   * @param {string} y
   * @returns {boolean}
   */
  static above(x, y) {
    const parsedX = this._parse(x);
    const parsedY = this._parse(y);

    if (parsedX.major === parsedY.major) return parsedX.minor > parsedY.minor;
    return parsedX.major > parsedY.major;
  }

  /**
   * Checks whether version x is below version y
   * @param {string} x
   * @param {string} y
   * @returns {boolean}
   */
  static below(x, y) {
    const parsedX = this._parse(x);
    const parsedY = this._parse(y);

    if (parsedX.major === parsedY.major) return parsedX.minor < parsedY.minor;
    return parsedX.major < parsedY.major;
  }
};
