// webpack.config.js

const path = require("path");
const fs = require("fs");
const webpack = require("webpack");

module.exports = {
    optimization: {
        minimize: false
    },
    output: {
        path: path.join(__dirname, "dist"),
        library: "[name]",
        libraryTarget: "commonjs2",
        filename: "[name].js",
    },
    externals: [
        {
            "aws-sdk": true
        }
    ],
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    target: "node",
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {test: /\.tsx?$/, loader: "ts-loader"},
            /*
                        {test: /\.json$/, loader: 'json-loader'}
            */
        ]
    },
    entry: "./lambdas/test.ts"
};