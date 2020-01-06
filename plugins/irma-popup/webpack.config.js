const path = require('path');

module.exports = {
  mode: 'production',

  entry: {
    'irma': './index.js'
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js',
    library: 'irma-popup',
    libraryTarget: 'umd',
  },

  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.ttf$/,
        loader: 'file-loader'
      }
    ]
  }
};

