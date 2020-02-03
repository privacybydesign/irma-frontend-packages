const path = require('path');
const nodeExternals = require('webpack-node-externals');

const clientRules = {
    mode: 'development',

    entry: {
        'irma': './index.js'
    },

    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        library: 'irma-legacy',
        libraryTarget: 'umd',
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
                    'css-loader',
                ]
            },
            {
                test: /\.ttf$/,
                loader: 'url-loader'
            }
        ]
    }
};

const serverRules = {
    mode: 'development',
    target: 'node',

    entry: {
        'irma.node': './index.js'
    },

    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        library: 'irma-legacy',
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
                loader: 'null-loader'
            },
            {
                test: /irma-popup/,
                loader: 'null-loader'
            }
        ]
    },

    externals: [nodeExternals({
        whitelist: [/\.css$/i, /irma-popup/]
    })],
};

module.exports = [clientRules, serverRules];
