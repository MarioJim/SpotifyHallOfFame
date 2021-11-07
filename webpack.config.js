const path = require('path');

module.exports = (env) => {
  const isProd = env && env.production;
  const common = {
    entry: './src/main.ts',
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
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
      filename: 'main.bundle.js',
      path: path.resolve(__dirname, 'public'),
    },
  };
  return isProd
    ? common
    : {
        ...common,
        devServer: {
          liveReload: true,
          open: true,
          port: 8080,
        },
        stats: {
          modulesSort: 'size',
        },
      };
};
