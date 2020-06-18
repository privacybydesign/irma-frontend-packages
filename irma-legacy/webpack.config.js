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
        library: 'irma',
        libraryTarget: 'umd',
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
                test: /\.(ttf|woff2)$/,
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
        library: 'irma',
        libraryTarget: 'umd'
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
