const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

/** Load monkeymask-website/.env.local so dev builds pick up the same Convex URL. */
function loadWebsiteEnv() {
  const envPath = path.resolve(__dirname, '../monkeymask-website/.env.local');
  try {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // Optional — extension still builds without a local Convex deployment.
  }
}

function resolveConvexSiteUrlForBuild() {
  loadWebsiteEnv();
  const explicit =
    process.env.MONKEYMASK_CONVEX_URL?.trim() ||
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.trim() ||
    process.env.CONVEX_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const cloud = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (cloud) return cloud.replace(/\/$/, '').replace('.convex.cloud', '.convex.site');
  return '';
}

const convexSiteUrlForBuild = resolveConvexSiteUrlForBuild();

module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
  // Strip developer console noise from production builds. `console.error` is
  // kept so genuine failures still surface for field diagnostics; the chatty
  // log/info/debug/warn calls are removed as dead code by Terser.
  optimization: isProduction
    ? {
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                pure_funcs: [
                  'console.log',
                  'console.info',
                  'console.debug',
                  'console.warn',
                ],
              },
            },
          }),
        ],
      }
    : undefined,
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
      '@monkeymask/core': path.resolve(__dirname, '../packages/core/dist/index.js'),
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
    // Point the wallet at the MonkeyMask Convex NFT index (same URL as the website).
    // Falls back to self-crawl + community indexer when unset.
    new webpack.DefinePlugin({
      'process.env.MONKEYMASK_CONVEX_URL': JSON.stringify(convexSiteUrlForBuild),
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
