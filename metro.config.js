// Permite importar el modelo 3D de Owi (.glb) como recurso.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;
