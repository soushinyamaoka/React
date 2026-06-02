// モノレポ対応の Metro 設定
// packages/shared を解決できるように watch & nodeModulesPath を追加する
// Expo SDK 54 公式 monorepo ガイド (https://docs.expo.dev/guides/monorepos/) 準拠
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
