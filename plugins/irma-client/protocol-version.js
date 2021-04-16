module.exports = class {
  constructor(str) {
    const split = str.split('.').map((x) => parseInt(x));
    if (split.length !== 2) throw new Error('Length does not match');
    const version = this._parse(str);
    this.major = version.major;
    this.minor = version.minor;
  }

  _parse(str) {
    const split = str.split('.').map((x) => parseInt(x));
    if (split.length !== 2) throw new Error('Length does not match');
    return {
      major: split[0],
      minor: split[1],
    };
  }

  above(other) {
    if (typeof other === 'string') other = this._parse(other);

    if (this.major === other.major) return this.minor > other.minor;
    return this.major > other.major;
  }

  below(other) {
    if (typeof other === 'string') other = this._parse(other);

    if (this.major === other.major) return this.minor < other.minor;
    return this.major < other.major;
  }
};
