const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable symlink resolution for pnpm
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
