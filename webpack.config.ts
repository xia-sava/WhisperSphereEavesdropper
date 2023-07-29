import * as path from "path";
import { Configuration } from 'webpack';
// @ts-ignore
import CopyPlugin from "copy-webpack-plugin";

const mode = process.env.NODE_ENV == "staging" ? "production" : (process.env.NODE_ENV || "development");

const config: Configuration = {
    entry: {
        background: path.join(__dirname, "src", "background.ts"),
        content: path.join(__dirname, "src", "content.ts"),
        popup: path.join(__dirname, "src", "popup", "popup.ts"),
        options: path.join(__dirname, "src", "options", "options.ts"),
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    mode: mode === "production" ? "production" : "development",
    devtool: mode === 'production' ? false : 'inline-source-map',
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'src/manifest.json' },
                { from: 'src/**/*.html', to: '[name].html' },
                { from: 'src/images', to: 'images' },
            ],
        }),
    ],
}

export default config;
