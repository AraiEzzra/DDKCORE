const moment = require('moment');
const buffer = require('buffer');
const path = require('path');
const util = require('util');
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
          util.format('mkdir -p %s', versionDir),
          util.format('mkdir -p %s/logs', versionDir),
          util.format('mkdir -p %s/pids', versionDir),
          util.format('mkdir -p %s/public', versionDir),
          util.format('cp %s/app.js %s', releaseDir, versionDir),
          util.format('cp %s/config.json %s', __dirname, versionDir),
          util.format('cp %s/package.json %s', __dirname, versionDir),
          util.format('cp %s/genesisBlock.json %s', __dirname, versionDir),
          util.format('cp %s/LICENSE %s', __dirname, versionDir),
          util.format('mkdir -p %s/src/sql/migrations', versionDir),
          util.format('cp %s/src/sql/*.sql %s/src/sql/', __dirname, versionDir),
          util.format('cp %s/src/sql/migrations/*.sql %s/src/sql/migrations/', __dirname, versionDir),
          util.format('cd %s/public && mkdir -p ./static', __dirname),
          'npm install && bower install && grunt release && cd ../',
          util.format('cp %s/public/wallet.html %s/public/', __dirname, versionDir),
          util.format('cp %s/public/loading.html %s/public/', __dirname, versionDir),
          util.format('cp -Rf %s/public/images %s/public/', __dirname, versionDir),
          util.format('cp -Rf %s/public/partials %s/public/', __dirname, versionDir),
          util.format('cp -RfL %s/public/static %s/public/', __dirname, versionDir),
          util.format('mkdir -p %s/public/node_modules', versionDir),
          util.format('cp -Rf %s/public/node_modules/chart.js %s/public/node_modules', __dirname, versionDir),
          util.format('mkdir -p %s/public/bower_components', versionDir),
          util.format('mkdir -p %s/public/socket.io', versionDir),
          util.format('cp -Rf %s/public/bower_components/jquery %s/public/bower_components', __dirname, versionDir),
          util.format('cp -Rf %s/public/bower_components/materialize %s/public/bower_components', __dirname, versionDir),
          util.format('cp -Rf %s/public/bower_components/blob %s/public/bower_components', __dirname, versionDir),
          util.format('cp -Rf %s/public/bower_components/file-saver %s/public/bower_components', __dirname, versionDir)
          ].join(' && ')
        )
      },

      folder: {
          command: 'mkdir -p ' + releaseDir
      },

      build: {
          command: 'cd ' + versionDir + '/ && touch build && echo "v' + today + '" > build'
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
    }
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
