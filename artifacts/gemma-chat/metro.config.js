const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const proxyUrl = process.env.EXPO_PACKAGER_PROXY_URL;
      if (proxyUrl && req.headers.origin) {
        req.headers.origin = proxyUrl;
      }
      middleware(req, res, next);
    };
  },
};

module.exports = config;
