const webpack = require('webpack')
const namespaces = require('./namespaces')

module.exports = {
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-viewport',
    '@storybook/addon-links',
    '@storybook/addon-measure',
    '@storybook/addon-a11y',
    'storybook-addon-designs',
    'storybook-dark-mode',
    'storybook-addon-themes',
  ],
  features: {
    postcss: false,
  },
  core: {
    builder: 'webpack5',
  },
  webpackFinal: (config) => {
    const final = config

    // Reduce error logging
    final.devServer = { stats: 'errors-only' }

    // Buffer not in webpack5 anymore.
    final.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    )
    // Add loaders for twig, md, yml.
    final.module.rules.push(
      {
        test: /\.twig$/,
        use: [
          {
            loader: 'raw-loader',
          },
        ],
      },
      {
        test: /\.ya?ml$/,
        type: 'json',
        use: 'yaml-loader',
      },
      {
        test: /\.(md)$/,
        loader: 'file-loader',
        options: {
          emitFile: false,
        },
      },
    )

    // Ignore files from being watched
    final.watchOptions = {
      ignored: /.*(?<!((\.(stories\.(jsx|mdx?)|(html\.)?twig)|yml)))$/,
    }

    // Add namespaces as alias.
    final.resolve.alias = {
      ...final.module.alias,
      ...namespaces,
    }
    return final
  },
}
