var gulp = require("gulp");
var babel = require("gulp-babel");
var changed = require("gulp-changed");
var uglify = require("gulp-uglify");
var pump = require("pump");
var cleanCSS = require("gulp-clean-css");
var htmlmin = require("gulp-htmlmin");

gulp.task("build", ["compile", "min-copy"], function() {

});

var DEST = "./temp/js";
gulp.task("compile", function() {
    return gulp.src(["./js/*.js", "!./js/*.min.js"])
        .pipe(changed(DEST))
        .pipe(babel())
        .pipe(gulp.dest(DEST));
});

gulp.task("compress", function( callback ) {
    pump([
        gulp.src("temp/js/*.js"),
        uglify(),
        gulp.dest("./build/js")
    ],
        callback
    );
});

gulp.task("compress-css", function() {
    gulp.src("temp/css/*.css")
        .pipe(cleanCSS())
        .pipe(gulp.dest("build/css"))
});

gulp.task("compress-html", function() {
    gulp.src("temp/*.html")
        .pipe(htmlmin( {collapseWhitespace: true} ))
        .pipe(gulp.dest("build"))
});

gulp.task("min-copy", function() {
    return gulp.src("./js/*.min.js")
        .pipe(gulp.dest("./dist/js"))
});

gulp.task("copy", function() {
    gulp.src("*.html")
        .pipe(gulp.dest("./temp"));
    gulp.src("css/*.css")
        .pipe(gulp.dest("temp/css/"))
});
