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
            api: path.resolve(DIR, 'api'),
            shared: path.resolve(DIR, 'shared'),
        },
    },
    output: {
        filename: 'app.js',
        path: path.join(OUTPUT_DIR, 'api'),
        publicPath: '/',
    },
};

const coreConfig = {
    entry: path.join(DIR, 'core', 'server.ts'),
    context: path.resolve(DIR, 'core'),
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            core: path.resolve(DIR, 'core'),
            shared: path.resolve(DIR, 'shared'),
        },
    },
    output: {
        filename: 'app.js',
        path: path.join(OUTPUT_DIR, 'core'),
        publicPath: '/',
    },
    // plugins: [
    //     new CopyWebpackPlugin([
    //         {
    //             from: './build',
    //             to: './',
    //         },
    //     ]),
    // ],
};

const migrationConfig = {
    entry: path.join(DIR, 'migration', 'migration.ts'),
    context: path.resolve(DIR, 'migration'),
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            migration: path.resolve(DIR, 'migration'),
            shared: path.resolve(DIR, 'shared'),
            core: path.resolve(DIR, 'core'),
        },
    },
    output: {
        filename: 'app.js',
        path: path.join(OUTPUT_DIR, 'migration'),
        publicPath: '/',
    },
};

const generateGenesisConfig = {
    entry: path.join(DIR, 'core', 'genesisGenerator.ts'),
    context: path.resolve(DIR, 'core'),
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            core: path.resolve(DIR, 'core'),
            shared: path.resolve(DIR, 'shared'),
        },
    },
    output: {
        filename: 'generateGenesis.js',
        path: path.join(OUTPUT_DIR),
        publicPath: '/',
    }
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
        case 'migration':
            appConfig = migrationConfig;
            break;
        case 'genesis':
            appConfig = generateGenesisConfig;
            break;
    }
    return Object.assign({}, baseConfig, appConfig);
};
