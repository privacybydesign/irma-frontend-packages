module.exports = class {
  constructor(str) {
    const split = str.split('.').map((x) => parseInt(x));
    if (split.length !== 2) throw new Error('Length does not match');
    this._major = split[0];
    this._minor = split[1];
  }

  above(other) {
    if (this._major === other._major) return this._minor > other._minor;
    return this._major > other._major;
  }

  below(other) {
    if (this._major === other._major) return this._minor < other._minor;
    return this._major < other._major;
  }
};
