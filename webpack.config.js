const path = require('path');
const DIR = path.resolve(__dirname);
const nodeExternals = require('webpack-node-externals');

const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: path.join(DIR, 'core', 'app.js'),
    context: path.resolve(DIR, 'core'),
    target: 'node',
    externals: [nodeExternals()],
    node: {
        __dirname: false,
        __filename: false,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            {
                test: /\.(sql|ttf|gif|png|ico)$/,
                use: 'file-loader',
            },
            {
                test: /\.(html)$/,
                use: 'html-loader',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            src: path.resolve(DIR, 'core'),
        },
    },
    output: {
        filename: 'app.js',
        path: path.join(DIR, 'dist'),
        publicPath: '/',
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: './build',
                to: './',
            },
        ]),
    ],
};
