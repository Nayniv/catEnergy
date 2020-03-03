"use strict";

var gulp = require("gulp");
var plumber = require("gulp-plumber");
var sourcemap = require("gulp-sourcemaps");
var less = require("gulp-less");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task("css", function() {
  return gulp.src("source/less/style.less")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(less())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("source/css"))
    .pipe(server.stream());
});

gulp.task("js", function() {
  return gulp.src('source/scripts/*.js', { sourcemaps: true })
    .pipe(plumber())
    .pipe(concat('script.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('source/js', { sourcemaps: '.' }))
    .pipe(server.stream());
});

gulp.task("server", function() {
  server.init({
    server: "source/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/scripts/*.js", gulp.series("js"));
  gulp.watch("source/less/**/*.less", gulp.series("css"));
  gulp.watch("source/*.html").on("change", server.reload);
});

gulp.task("start", gulp.series("css", "js", "server"));
