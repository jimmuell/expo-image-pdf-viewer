const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable symlink resolution for pnpm
config.resolver.unstable_enableSymlinks = true;
// Enable package.json `exports` field resolution
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
