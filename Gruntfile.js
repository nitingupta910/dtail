module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            server: {
                src: ['*.js']
            },
            client: {
                src: ['public/js/*']
            }
        },
    });

}
