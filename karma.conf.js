module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-coverage'),
      require('karma-jasmine-html-reporter'),
      require('karma-junit-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false
    },
    reporters: ['progress', 'coverage', 'kjhtml', 'junit'],
    junitReporter: {
      outputDir: './',
      outputFile: 'junit.xml',
      suite: 'unit-tests',
      useBrowserName: false
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'cobertura' }
      ]
    },
    // Remove custom launchers and use default ChromeHeadless
    browsers: ['ChromeHeadless'],
    singleRun: true,
    restartOnFileChange: false
  });
};