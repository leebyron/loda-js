var exec = require('child_process').exec;
var uglify = require('uglify-js');
var Promise = require('promise');

module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      all: ['src/*.js'],
      options: {
        asi: true,
        curly: false,
        eqeqeq: true,
        eqnull: true,
        expr: true,
        forin: true,
        freeze: true,
        immed: true,
        indent: 2,
        iterator: true,
        noarg: true,
        node: true,
        noempty: true,
        nonstandard: true,
        trailing: true,
        undef: true,
        unused: 'vars',
      }
    },
    coffeelint: {
      all: ['spec/*.coffee'],
    },
    build: {
      all: [{
        libName: 'loda',
        src: 'src/loda.js',
        wrapper: './resources/universal-module.js',
        dest: 'browser/',
        raw: 'loda.js',
        min: 'loda.min.js',
        map: 'loda.min.map',
      },
      {
        libName: 'loda-core',
        src: 'src/loda-core.js',
        wrapper: './resources/global-module.js',
        dest: 'browser/',
        raw: 'loda-core.js',
        min: 'loda-core.min.js',
        map: 'loda-core.min.map',
      }],
      options: {
        mangle: {
          toplevel: true
        },
        compress: {
          pure_getters: true,
          unsafe: true,
        },
        reserved: ['module', 'define', 'loda']
      }
    },
    jasmine_node: {
      all: ['spec/'],
      options: {
        coffee: true,
        verbose: true,
      }
    },
    size: {
      all: [{
        raw: 'browser/loda-core.js',
        min: 'browser/loda-core.min.js'
      },
      {
        raw: 'browser/loda.js',
        min: 'browser/loda.min.js'
      }]
    }
  });

  grunt.registerMultiTask('build', function () {
    this.data.forEach(function (data) {
      var srcData = grunt.file.read(data.src);
      var wrapper = grunt.file.read(data.wrapper);
      var srcData = wrapper
        .replace(/LIBNAME/g, data.libName)
        .replace('"MODULE"', '\n' + srcData);
      process.chdir(data.dest);
      grunt.file.write(data.raw, srcData);
      var result;
      try {
        result = uglify.minify(
          data.raw,
          this.options({outSourceMap: data.map})
        );
      } catch (error) {
        grunt.fail.fatal(error);
      }
      grunt.file.write(data.min, result.code);
      grunt.file.write(data.map, result.map);
      process.chdir('..');
    }, this);
  });

  grunt.registerMultiTask('size', function () {
    var print;
    this.data.forEach(function (data) {
      print = print ?
        print.then(function () { return printSizes(data); }) :
        printSizes(data);
    });
    print.then(this.async());

    function printSizes(data) {
      return new Promise(function (resolve) {
        console.log(('\n' + data.raw).underline);
        exec('cat '+data.raw+' | wc -c', function (error, out) {
          if (error) throw new Error(error);
          var rawBytes = parseInt(out);
          console.log('         Original: ' +
            (rawBytes + ' bytes').cyan);
          exec('gzip -c '+data.raw+' | wc -c', function (error, out) {
            if (error) throw new Error(error);
            var zippedBytes = parseInt(out);
            var pctOfA = Math.floor(10000 * (1 - (zippedBytes / rawBytes))) / 100;
            console.log('       Compressed: ' +
              (zippedBytes + ' bytes').cyan + ' ' +
              (pctOfA + '%').green);
            exec('cat '+data.min+' | wc -c', function (error, out) {
              if (error) throw new Error(error);
              var minifiedBytes = parseInt(out);
              var pctOfA = Math.floor(10000 * (1 - (minifiedBytes / rawBytes))) / 100;
              console.log('         Minified: ' +
                (minifiedBytes + ' bytes').cyan + ' ' +
                (pctOfA + '%').green);
              exec('gzip -c '+data.min+' | wc -c', function (error, out) {
                if (error) throw new Error(error);
                var zippedMinBytes = parseInt(out);
                var pctOfA = Math.floor(10000 * (1 - (zippedMinBytes / rawBytes))) / 100;
                console.log('  Min\'d & Cmprs\'d: ' +
                  (zippedMinBytes + ' bytes').cyan + ' ' +
                  (pctOfA + '%').green);
                resolve();
              })
            })
          })
        })
      });
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-coffeelint');
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.registerTask('lint', ['jshint', 'coffeelint']);
  grunt.registerTask('test', ['jasmine_node']);
  grunt.registerTask('default', ['lint', 'build', 'test', 'size']);
}
