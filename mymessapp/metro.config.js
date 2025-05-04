// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration for native modules
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Add transpile modules with symlinks (needed for some native modules)
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.disableHierarchicalLookup = false;
config.resolver.nodeModulesPaths = ['node_modules'];

module.exports = config; 