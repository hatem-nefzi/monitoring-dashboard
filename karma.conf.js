module.exports = function (config) {
  config.set({
    // ...
    reporters: ['progress', 'junit', 'coverage'],

    junitReporter: {
      outputDir: 'coverage',
      outputFile: 'junit.xml',
      useBrowserName: false
    },

    coverageReporter: {
      reporters: [
        { type: 'html', dir: 'coverage/' },
        { type: 'cobertura', file: 'cobertura-coverage.xml' }
      ]
    },

    // ...
  });
};
