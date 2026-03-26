const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add GLB/GLTF to asset extensions for 3D model loading
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;
