const moment = require('moment');
const buffer = require('buffer');
const path = require('path');

const config = require('./config.json');

module.exports = (grunt) => {
  const files = [
    'logger.js',
    'api/**/*.js',
    'helpers/**/*.js',
    'modules/**/*.js',
    'logic/*.js',
    'schema/**/*.js',
    'sql/**/*.js',
    'app.js',
  ];

  const today = moment().format('HH:mm:ss DD/MM/YYYY');

  const releaseDir = path.join(__dirname, 'release');
  const versionDir = path.join(releaseDir, config.version);

  const maxBufferSize = buffer.kMaxLength - 1;

  grunt.initConfig({
    obfuscator: {
      files,
      entry: 'app.js',
      out: 'release/app.js',
      strings: true,
      root: __dirname,
    },

    exec: {
      package: {
        command: () => ([
          `mkdir -p ${versionDir}`,
          `mkdir -p ${versionDir}/logs`,
          `mkdir -p ${versionDir}/pids`,
          `mkdir -p ${versionDir}/public`,
          `cp ${releaseDir}/app.js ${versionDir}`,
          `cp ${__dirname}/config.json ${versionDir}`,
          `cp ${__dirname}/package.json ${versionDir}`,
          `cp ${__dirname}/genesisBlock.json ${versionDir}`,
          `cp ${__dirname}/LICENSE ${versionDir}`,
          `mkdir -p ${versionDir}/sql/migrations`,
          `cp ${__dirname}/sql/*.sql ${versionDir}/sql/`,
          `cp ${__dirname}/sql/migrations/*.sql ${versionDir}/sql/migrations/`,
          `cd ${__dirname}/public && mkdir -p ./static', __dirname)`,
          'npm install && bower install && grunt release && cd ../',
          `cp ${__dirname}/public/wallet.html ${versionDir}/public/`,
          `cp ${__dirname}/public/loading.html ${versionDir}/public/`,
          `cp -Rf ${__dirname}/public/images ${versionDir}/public/`,
          `cp -Rf ${__dirname}/public/partials ${versionDir}/public/`,
          `cp -RfL ${__dirname}/public/static ${versionDir}/public/`,
          `mkdir -p ${versionDir}/public/node_modules`,
          `cp -Rf ${__dirname}/public/node_modules/chart.js ${versionDir}/public/node_modules`,
          `mkdir -p ${versionDir}/public/bower_components`,
          `mkdir -p ${versionDir}/public/socket.io`,
          `cp -Rf ${__dirname}/public/bower_components/jquery ${versionDir}/public/bower_components`,
          `cp -Rf ${__dirname}/public/bower_components/materialize ${versionDir}/public/bower_components`,
          `cp -Rf ${__dirname}/public/bower_components/blob ${versionDir}/public/bower_components`,
          `cp -Rf ${__dirname}/public/bower_components/file-saver ${versionDir}/public/bower_components`,
        ].join(' && ')),
      },

      folder: {
        command: `mkdir -p ${releaseDir}`,
      },

      build: {
        command: `cd ${versionDir}/ && touch build && echo "v${today}" > build`,
      },

      coverage: {
        command: 'export NODE_ENV=testnet && ./node_modules/.bin/nyc ./node_modules/.bin/_mocha',
        maxBuffer: maxBufferSize,
      },

      coverageSingle: {
        command: 'export NODE_ENV=testnet && ./node_modules/.bin/nyc cover --dir test/.coverage-unit ./node_modules/.bin/_mocha $TEST',
        maxBuffer: maxBufferSize,
      },

      fetchCoverage: {
        command: 'rm -rf ./test/.coverage-func.zip; curl -o ./test/.coverage-func.zip $HOST/coverage/download',
        maxBuffer: maxBufferSize,
      },
    },

    compress: {
      main: {
        options: {
          archive: `${versionDir}.tar.gz`,
          mode: 'tgz',
          level: 6,
        },
        files: [
          { expand: true, cwd: releaseDir, src: [`${config.version}/**`], dest: './' },
        ],
      },
    },

    eslint: {
      options: {
        configFile: '.eslintrc.json',
        format: 'codeframe',
        fix: false,
      },
      target: [
        'api/**/*.js',
        'helpers/**/*.js',
        'modules/**/*.js',
        'logic/**/*.js',
        'schema/**/*.js',
        'tasks/**/*.js',
        'test/**/*.js',
      ],
    },
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-obfuscator');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-eslint');

  grunt.registerTask('default', ['release']);
  grunt.registerTask('release', ['exec:folder', 'obfuscator', 'exec:package', 'exec:build', 'compress']);
  grunt.registerTask('jenkins', ['exec:coverageSingle']);
  grunt.registerTask('eslint-nofix', ['eslint']);
  grunt.registerTask('test', ['exec:coverage']);

  grunt.registerTask('eslint-fix', 'Run eslint and fix formatting', () => {
    grunt.config.set('eslint.options.fix', true);
    grunt.task.run('eslint');
  });
};
