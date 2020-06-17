const path = require('path');

module.exports = {
  mode: 'development',

  entry: {
    'irma': './index.js'
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    library: 'irma',
    libraryTarget: 'umd'
  },

  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    disableHostCheck: true
  },

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(ttf|woff2)$/,
        loader: 'url-loader'
      }
    ]
  }
};
