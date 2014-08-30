var exec = require('child_process').exec;
var uglify = require('uglify-js');

module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
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
      },
      all: ['loda.js', 'resources/*.js']
    },
    build: {
      build: {
        files: [{
          src: 'loda.js',
          dest: 'loda.min.js'
        }]
      }
    },
    jasmine_node: {
      options: {
        coffee: true,
      },
      all: ['spec/']
    },
    stats: {
      build: {}
    }
  });

  grunt.registerMultiTask('build', function () {
    this.files.map(function (file) {
      var data = grunt.file.read(file.src);
      var wrapper = grunt.file.read('./resources/universal-module.js');
      var wrapped = wrapper.replace('"%MODULE%"', data);
      var result = uglify.minify(wrapped, {
        fromString: true,
        mangle: {
          toplevel: true
        },
        compress: {
          comparisons: true,
          pure_getters: true,
          unsafe: true
        },
        output: {
          max_line_len: 2048,
        },
        reserved: ['module', 'define', 'loda']
      });
      grunt.file.write(file.dest, result.code)
    });
  });

  grunt.registerMultiTask('stats', function () {
    var done = this.async();
    exec('cat loda.js | wc -c', function (error, out) {
      if (error) throw new Error(error);
      var rawBytes = parseInt(out);
      console.log('     Concatenated: ' +
        (rawBytes + ' bytes').cyan);
      exec('gzip -c loda.js | wc -c', function (error, out) {
        if (error) throw new Error(error);
        var zippedBytes = parseInt(out);
        var pctOfA = Math.floor(10000 * (1 - (zippedBytes / rawBytes))) / 100;
        console.log('       Compressed: ' +
          (zippedBytes + ' bytes').cyan + ' ' +
          (pctOfA + '%').green);
        exec('cat loda.min.js | wc -c', function (error, out) {
          if (error) throw new Error(error);
          var minifiedBytes = parseInt(out);
          var pctOfA = Math.floor(10000 * (1 - (minifiedBytes / rawBytes))) / 100;
          console.log('         Minified: ' +
            (minifiedBytes + ' bytes').cyan + ' ' +
            (pctOfA + '%').green);
          exec('gzip -c loda.min.js | wc -c', function (error, out) {
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
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.registerTask('default', 'Lint, build and test.', ['jshint', 'build', 'jasmine_node', 'stats']);
}
