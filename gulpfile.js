'use strict';

var gulp = require('gulp'),
  del = require('del'),
  plumber = require('gulp-plumber'),
  sourcemap = require('gulp-sourcemaps'),
  postcss = require('gulp-postcss'),
  csso = require('gulp-csso'),
  rename = require('gulp-rename'),
  svgstore = require('gulp-svgstore'),
  svgsprite = require('gulp-svg-sprite'),
  posthtml = require('gulp-posthtml'),
  include = require('posthtml-include'),
  autoprefixer = require('autoprefixer'),
  less = require('gulp-less'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  webp = require('gulp-webp'),
  regexreplace = require('gulp-regex-replace'),
  imagemin = require('gulp-imagemin'),
  htmlmin = require('gulp-htmlmin'),
  server = require('browser-sync').create();

gulp.task('clean', function() {
  return del('build');
});

gulp.task('copy-polyfill', function() {
  return gulp.src([
      'source/polyfill/**/*.js'
    ], {
      base: 'source/polyfill'
    })
    .pipe(gulp.dest('build/js'));
});

gulp.task('copy', function() {
  return gulp.src([
      'source/fonts/**/*.{woff,woff2}',
      // 'source/img/**/*.{jpg,png,gif,webp}',
      'source/*.ico'
    ], {
      base: 'source'
    })
    .pipe(gulp.dest('build'));
});

gulp.task('css', function() {
  return gulp.src('source/less/style.less')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(less())
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest('build/css'))
    .pipe(csso())
    .pipe(rename('style.min.css'))
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest('build/css'));
});

gulp.task('js', function() {
  return gulp.src('source/js/**/*.js')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(concat('script.min.js'))
    .pipe(uglify())
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest('build/js'));
});

gulp.task('sprite-inline', function() {
  return gulp.src('source/img/sprite-inline/*.svg')
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename('sprite-inline.svg'))
    .pipe(gulp.dest('build/img'));
});

gulp.task('sprite-outline', function() {
  return gulp.src('source/img/sprite-outline/*.svg')
    .pipe(svgsprite({
      mode: {
        view: true
      },

      shape: {
        spacing: {
          padding: 5,
          box: 'border'
        },
        dimension: {
          attributes: false,
          precision: 2
        }
      }
    }))

    // Фиксим косяк плагина: не работает параметр box
    // Уменьшаем viewBox так, чтоб паддинги в него не входили
    .pipe(regexreplace({
      regex: '<view id=".+?" viewBox=".+?"',
      replace: function(match) {
          var viewbox = match.match(/[\d\-.]+ [\d\-.]+ [\d\-.]+ [\d\-.]+/)[0].split(' ');

          viewbox[0] = Number(viewbox[0])+5;
          viewbox[1] = Number(viewbox[1])+5;
          viewbox[2] = Number(viewbox[2])-10;
          viewbox[3] = Number(viewbox[3])-10;

          return match.replace(/[\d.\-]+ [\d.\-]+ [\d.\-]+ [\d.\-]+/, viewbox.join(' '));
        }
      }))
    .pipe(rename('sprite-outline.svg'))
    .pipe(gulp.dest('build/img'));
});

gulp.task('sprite', gulp.parallel(
  'sprite-inline',
  'sprite-outline'
));

gulp.task('html', function() {
  return gulp.src('source/*.html')
    .pipe(posthtml([include()]))
    .pipe(htmlmin ({collapseWhitespace: true}))
    .pipe(gulp.dest('build'));
});

gulp.task('webp', function() {
  return gulp.src('source/img/**/*.{jpg,png}')
    .pipe(webp({ quality: 90 }))
    .pipe(gulp.dest('build/img'));
});

gulp.task('imagemin', function() {
  return gulp.src('source/img/**/*.{jpg,png}')
    .pipe(imagemin([
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.jpegtran({ progressive: true })
    ]))
    .pipe(gulp.dest('build/img'));
});

gulp.task('build', gulp.series(
  'clean',
  'copy',
  'copy-polyfill',
  gulp.parallel(
    'css',
    'js',
    'sprite',
    'webp',
    'imagemin'
  ),
  'html'
));

gulp.task('refresh', function(done) {
  server.reload();
  done();
});

gulp.task('server', function() {
  server.init({ server: 'build/' });

  gulp.watch('source/less/**/*.less', gulp.series('css', 'refresh'));
  gulp.watch('source/js/**/*.js', gulp.series('js', 'refresh'));
  gulp.watch('source/*.html', gulp.series('html', 'refresh'));
  gulp.watch('source/img/sprite-inline/*.svg', gulp.series('sprite-inline', 'html', 'refresh'));
  gulp.watch('source/img/sprite-outline/*.svg', gulp.series('sprite-outline', 'refresh'));
});

gulp.task('start', gulp.series('build', 'server'));
