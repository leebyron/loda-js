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
      options: {
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
      },
      all: {
        wrapper: './resources/universal-module.js',
        src: 'loda.js',
        dest: 'loda.min.js'
      }
    },
    jasmine_node: {
      options: {
        coffee: true,
        verbose: true,
      },
      all: ['spec/']
    },
    stats: {
      all: {
        src: 'loda.js',
        min: 'loda.min.js'
      }
    }
  });

  grunt.registerMultiTask('build', function () {
    var data = grunt.file.read(this.data.src);
    var wrapper = grunt.file.read(this.data.wrapper);
    var wrapped = wrapper.replace('"%MODULE%"', data);
    var result = uglify.minify(wrapped, this.options());
    grunt.file.write(this.data.dest, result.code);
  });

  grunt.registerMultiTask('stats', function () {
    var data = this.data;
    var done = this.async();
    exec('cat '+data.src+' | wc -c', function (error, out) {
      if (error) throw new Error(error);
      var rawBytes = parseInt(out);
      console.log('     Concatenated: ' +
        (rawBytes + ' bytes').cyan);
      exec('gzip -c '+data.src+' | wc -c', function (error, out) {
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
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.registerTask('default', ['jshint', 'build', 'jasmine_node', 'stats']);
}
