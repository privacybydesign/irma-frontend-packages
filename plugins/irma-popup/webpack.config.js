const path = require('path');
const nodeExternals = require('webpack-node-externals');

const sharedRules = [
  {
    test: /\.js$/,
    exclude: /(node_modules|bower_components)/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
        plugins: ['@babel/plugin-proposal-object-rest-spread', '@babel/plugin-syntax-dynamic-import']
      }
    }
  },
];

const clientConfig = {
  target: 'web',
  entry: './index.js',
  output: {
    filename: 'index.js',
    chunkFilename: '[name].js',
    library: 'irma-legacy-popup',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: sharedRules.concat([
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: 'url-loader'
      },
      {
        test: /\.html$/,
        use: 'html-loader'
      }
    ])
  },
  externals: {
    'qrcode-terminal': 'qrcode'
  }
};

module.exports = [ clientConfig ];
