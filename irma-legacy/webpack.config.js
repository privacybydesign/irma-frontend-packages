const path = require('path');
const nodeExternals = require('webpack-node-externals');

const clientRules = {
    entry: './index.js',

    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'irma.js',
        chunkFilename: '[name].js',
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
            }
        ]
    }
};

const serverRules = {
    target: 'node',

    entry: './index.js',

    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'irma.node.js',
        libraryTarget: 'commonjs',
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
