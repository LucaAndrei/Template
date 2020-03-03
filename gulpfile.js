// gulpfile.js
// Heavily inspired by Mike Valstar's solution:
// http://mikevalstar.com/post/fast-gulp-browserify-babelify-watchify-react-build/

/*
    https://scotch.io/tutorials/a-quick-guide-to-using-livereload-with-gulp
    https://scotch.io/tutorials/getting-started-with-browserify#toc-why-browserify-
    http://mikevalstar.com/post/fast-gulp-browserify-babelify-watchify-react-build/
    https://gist.github.com/mattidupre/96f998ff685c8354e8b3
*/
"use strict";

var gulp = require('gulp'),

    watchify = require('watchify'),
    browserify = require('browserify'),

    buffer = require('vinyl-buffer'),
    rename = require('gulp-rename'),
    source = require('vinyl-source-stream'),

    sass = require('gulp-sass'),
    maps = require('gulp-sourcemaps'),
    watch = require('gulp-watch'),
    browserSync = require('browser-sync').create(),

    postcss = require("gulp-postcss"),

    concat = require("gulp-concat"),

    // POST CSS plugins
    autoprefixer = require("autoprefixer"),
    cssnano = require('cssnano'),
    size = require("gulp-size"),

    // Utils
    log = require("fancy-log"),
    beep = require("beeper");


var config = {
    main: {
        outputDir: './dist/**/*'
    },
    js: {
        src: './src/js/main.js',       // Entry point
        outputDir: './dist/build/',  // Directory to save bundle to
        outputFile: 'bundle.js' // Name to use for bundle
    },
    scss: {
        src: 'src/scss/**/*.scss',
        outputDir: './dist/css'
    }
};

function bundleCSS() {
    log('Compiling styles...');
    // Use gulp-concat-css to include vanilla CSS

    var plugins = [
        autoprefixer(), // Display the size of your project
        cssnano()  // Minify CSS
    ]

    return gulp.src(config.scss.src)
        .pipe(maps.init())
        .pipe(sass({ errLogToConsole: true }))
        .pipe(concat('styles.scss'))
        .on('error', beep)
        .pipe(maps.write())
        .pipe(rename('styles.css'))
        .pipe(gulp.dest(config.scss.outputDir))
        .pipe(postcss(plugins))
        .pipe(size())
        .pipe(browserSync.stream());
}

function bundleJS() {
    var bundler = watchify(browserify(config.js.src, { debug: true }));

    var rebundle = function () {
        log('Bundling scripts...');
        return bundler.bundle()
            .on('error', function (e) {
                beep();
                log.error('Error (Browserify): ' + e.message);
            })
            .pipe(source(config.js.src))
            .pipe(buffer())
            .pipe(maps.init({ loadMaps: true }))
            .pipe(rename(config.js.outputFile))          // Rename output from 'main.js' to 'bundle.js'
            .pipe(gulp.dest(config.js.outputDir))        // Save 'bundle' to build/
            .pipe(browserSync.stream());
    };

    bundler.on('update', function () {
        return rebundle();
    });

    return rebundle();
}


gulp.task('bundle', function () {
    bundleJS();  // Chain other options -- sourcemaps, rename, etc.
    return bundleCSS();
})

gulp.task('watch', function () {
    browserSync.init({
        server: {
            baseDir: "./",
            index: './index.html'
        }
    });
    watch(config.scss.src, bundleCSS);
    bundleJS();
    watch('./*.html').on('change', browserSync.reload);
});

exports.w = gulp.series('bundle', 'watch')