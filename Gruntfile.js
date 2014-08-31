var exec = require('child_process').exec;
var uglify = require('uglify-js');

module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      all: ['loda.js', 'resources/*.js'],
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
      all: {
        src: 'src/loda.js',
        wrapper: './resources/universal-module.js',
        dest: 'browser/',
        raw: 'loda.js',
        min: 'loda.min.js',
        map: 'loda.min.map',
      },
      options: {
        mangle: {
          toplevel: true
        },
        compress: {
          comparisons: true,
          pure_getters: true,
          unsafe: true
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
      all: {
        raw: 'browser/loda.js',
        min: 'browser/loda.min.js'
      }
    }
  });

  grunt.registerMultiTask('build', function () {
    var data = grunt.file.read(this.data.src);
    var wrapper = grunt.file.read(this.data.wrapper);
    process.chdir(this.data.dest);
    var wrapped = wrapper.replace('"%MODULE%"', data);
    grunt.file.write(this.data.raw, wrapped);
    var result;
    try {
      result = uglify.minify(
        this.data.raw,
        this.options({outSourceMap: this.data.map})
      );
    } catch (error) {
      grunt.fail.fatal(error);
    }
    grunt.file.write(this.data.min, result.code);
    grunt.file.write(this.data.map, result.map);
    process.chdir('..');
  });

  grunt.registerMultiTask('size', function () {
    var data = this.data;
    var done = this.async();
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
            done();
          })
        })
      })
    })
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-coffeelint');
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.registerTask('lint', ['jshint', 'coffeelint']);
  grunt.registerTask('test', ['jasmine_node']);
  grunt.registerTask('default', ['lint', 'build', 'test', 'size']);
}
