module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        fs: false,
        crypto: false,
        util: false,
      };

      // Remove source-map-loader noise from face-api.js package internals.
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        (warning) => {
          const isSourceMapWarning =
            typeof warning?.message === "string" &&
            warning.message.includes("Failed to parse source map");
          const fromFaceApi =
            typeof warning?.module?.resource === "string" &&
            warning.module.resource.includes("node_modules/face-api.js");
          return isSourceMapWarning && fromFaceApi;
        },
      ];

      return webpackConfig;
    },
  },
};
