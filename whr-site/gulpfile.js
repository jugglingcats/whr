var gulp = require('gulp'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    jshint = require('gulp-jshint'),
    autoprefixer = require('gulp-autoprefixer')
uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css'),
    rename = require("gulp-rename");

var imgproc = require('gulp-responsive');

var dest = "build/";

// Compile Sass to css and place it in css/styles.css
gulp.task('styles', function () {
    return gulp.src('src/scss/*.scss')
        .pipe(sass({
            'sourcemap=none': true
        }))
        .pipe(concat('styles.css'))
        .pipe(autoprefixer('last 2 version', 'ie 9'))
        .pipe(gulp.dest(dest + 'css/'))
});

// Watch for changes in scss files
// Watch for errors in js file
gulp.task('watch', function () {
    gulp.watch('src/scss/**/*.scss', ['styles']);
    gulp.watch('src/css/**/*.css', ['styles']);
    gulp.watch('src/js/*.js', ['jshint', 'compress']);
    gulp.watch('src/img/**', ['images']);
    gulp.watch('src/*.html', ['html']);
});

// Catch JS errors
gulp.task('jshint', function () {
    return gulp.src('src/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
});

// Ugligy JS
gulp.task('compress', function () {
    return gulp.src('src/js/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(dest + 'js'));
});

gulp.task('video', function () {
    gulp.src('src/video/whr/**')
        .pipe(gulp.dest(dest + 'hls'));
});

gulp.task('html', function () {
    gulp.src('src/*.html')
        .pipe(gulp.dest(dest));
});

gulp.task('ico', function () {
    gulp.src('src/favicon.ico')
        .pipe(gulp.dest(dest));
});

gulp.task('images', function () {
    return gulp.src('src/img/**')
        .pipe(imgproc({
            // Resize all JPG images to three different sizes: 200, 500, and 630 pixels
            '**/gallery/*.jpg': [{
                width: 320,
                rename: {suffix: '-320px'}
            }, {
                width: 720,
                rename: {suffix: '-720px'}
            }
                // , {
                // Compress, strip metadata, and rename original image
                // rename: {suffix: '-original'}
                // }
            ],
            '*.jpg': [
                {
                    width: 720,
                    rename: {suffix: '-720px'}
                }, {
                    width: 1350,
                    rename: {suffix: '-1350px'}
                }, {
                    width: 1920,
                    rename: {suffix: '-1920px'}
                }
                // , {
                // Compress, strip metadata, and rename original image
                // rename: {suffix: '-original'}
                // }
            ]
            // Resize all PNG images to be retina ready
            // '*.png': [{
            //     width: 250
            // }, {
            //     width: 250 * 2,
            //     rename: {suffix: '@2x'}
            // }]
        }, {
            // global
            quality: 70,
            progressive: true,
            withMetadata: false
        }))
        .pipe(gulp.dest(dest + 'img'))
});

// Minify CSS
gulp.task('minify-css', function () {
    return gulp.src('css/styles.css')
        .pipe(rename({suffix: ".min"}))
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(gulp.dest(dest + 'css'));
});

// All tasks together
gulp.task('default', ['html', 'styles', 'compress', 'jshint', 'images', 'video', 'ico']);