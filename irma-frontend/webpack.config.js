const path = require('path');

module.exports = {
  mode: 'development',

  entry: {
    'irma': [
      'core-js/modules/es.promise',
      'core-js/modules/es.array.iterator',
      'core-js/modules/es.array.includes',
      './index.js'
    ],
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
        test: /\.js$/i,
        use: {
          loader: 'babel-loader',
          options: {
            'presets': [
              [
                '@babel/preset-env',
                {
                  'targets': '> 0.25%, not dead',
                  'useBuiltIns': 'entry',
                  'corejs': { 'version': 3, 'proposals': true },
                },
              ],
            ],
          },
        },
      },
    ],
  },
};
