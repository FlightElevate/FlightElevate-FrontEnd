// This hook removes the postinstall script from core-js during pnpm install.
// This prevents ERR_PNPM_IGNORED_BUILDS error on Render (pnpm v9+).
module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === 'core-js') {
        delete pkg.scripts;
      }
      return pkg;
    }
  }
};
