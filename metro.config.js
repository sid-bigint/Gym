const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for 3D assets and WASM
config.resolver.assetExts.push('wasm', 'glb', 'gltf', 'mtl', 'obj');
config.resolver.sourceExts.push('wasm');

module.exports = config;
