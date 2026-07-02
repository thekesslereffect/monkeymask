const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background/background.ts',
    content: './src/content/content.ts',
    injected: './src/content/injected.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  // MV3 CSP blocks eval(); webpack's default devtool uses eval-source-map.
  devtool: isProduction ? false : 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@monkeymask/wallet-standard': path.resolve(__dirname, '../packages/wallet-standard/dist/index.js'),
    },
    fallback: {
      "crypto": require.resolve("crypto-browserify", { paths: [__dirname] }),
      "http": require.resolve("stream-http", { paths: [__dirname] }),
      "https": require.resolve("https-browserify", { paths: [__dirname] }),
      "stream": require.resolve("stream-browserify", { paths: [__dirname] }),
      "buffer": require.resolve("buffer/", { paths: [__dirname] }),
      "url": require.resolve("url/", { paths: [__dirname] }),
      "vm": require.resolve("vm-browserify", { paths: [__dirname] })
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),
    // Optional: point the wallet at the MonkeyMask Convex NFT index. When unset
    // the extension falls back to its self-crawl + community indexer.
    new webpack.DefinePlugin({
      'process.env.MONKEYMASK_CONVEX_URL': JSON.stringify(process.env.MONKEYMASK_CONVEX_URL || '')
    }),
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons' }
      ]
    })
  ]
  };
};
