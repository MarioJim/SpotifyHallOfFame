const path = require('path');

const OptimizeThreePlugin = require('@vxna/optimize-three-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  let config = {
    target: 'browserslist',
    entry: './src/main.ts',
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
    plugins: [new OptimizeThreePlugin()],
    performance: {
      hints: false,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: { transpileOnly: true },
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'public'),
    },
  };

  if (!isProd) {
    config = {
      ...config,
      devServer: {
        liveReload: true,
        open: true,
        port: 8080,
      },
      stats: {
        modulesSort: 'size',
      },
    };
  }

  return config;
};
