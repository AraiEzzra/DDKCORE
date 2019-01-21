const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const DIR = path.resolve(__dirname);
const OUTPUT_DIR = path.resolve(__dirname, 'dist');

const baseConfig = {
    mode: 'development',
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
};

const apiConfig = {
    entry: path.join(DIR, 'api', 'server.ts'),
    context: path.resolve(DIR, 'api'),
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            src: path.resolve(DIR, 'api'),
        },
    },
    output: {
        filename: 'app.js',
        path: path.join(OUTPUT_DIR, 'api'),
        publicPath: '/',
    },
};

const coreConfig = {
    entry: path.join(DIR, 'core', 'app.js'),
    context: path.resolve(DIR, 'core'),
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            src: path.resolve(DIR, 'core'),
        },
    },
    output: {
        filename: 'app.js',
        path: path.join(OUTPUT_DIR, 'core'),
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

module.exports = env => {

    let appConfig;

    switch (env.service) {
        case 'api':
            appConfig = apiConfig;
            break;
        case 'core':
            appConfig = coreConfig;
            break;
    }
    return Object.assign({}, baseConfig, appConfig);
};
