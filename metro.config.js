const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .wasm files, which are required by expo-sqlite
config.resolver.assetExts.push('wasm');
config.resolver.sourceExts.push('wasm');

module.exports = config;
