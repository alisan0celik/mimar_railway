const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

const defaultWatchFolders = Array.isArray(config.watchFolders) ? config.watchFolders : [];

config.watchFolders = Array.from(new Set([...defaultWatchFolders, workspaceRoot]));
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.assetExts = Array.from(new Set([...config.resolver.assetExts, "wasm"]));

const blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  // Backend build output is deleted/rebuilt during dev — must not be watched by Metro.
  /[/\\]apps[/\\]backend[/\\]dist[/\\].*/,
  /[/\\]apps[/\\]backend[/\\]node_modules[/\\].*/,
];

config.resolver.blockList = blockList;

module.exports = config;
