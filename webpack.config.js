const path = require('path');
const DIR = path.resolve(__dirname);
const fs = require('fs');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'development',
    entry: path.join(DIR, 'src', 'app.js'),
    context: path.resolve(DIR, "src"),
    target: "node",
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            }
        ]
    },
    resolve: {
        modules: [
            path.resolve(__dirname),
            "node_modules"
        ],
        extensions: ['.ts', '.js', '.json', '.sql', '.*'],
        alias: {
            src: path.resolve(__dirname, 'src'),
        }
    },
    output: {
        filename: "app.js",
        path: path.join(DIR, 'dist')
    },
    plugins: [],
};
