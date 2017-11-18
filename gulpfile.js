var gulp = require("gulp");
var babel = require("gulp-babel");
var changed = require("gulp-changed");
var uglify = require("gulp-uglify");
var pump = require("pump");
var cleanCSS = require("gulp-clean-css");
var htmlmin = require("gulp-htmlmin");
var rename = require("gulp-rename");
var concat = require("gulp-concat");

gulp.task("build", ["compile", "min-copy"], function() {

});

var DEST = "./temp/js";
gulp.task("compile", function() {
    return gulp.src(["./js/*.js", "!./js/*.min.js"])
        .pipe(changed(DEST))
        .pipe(babel())
        .pipe(gulp.dest(DEST));
});

gulp.task("minify", ["compress", "compress-css", "min-copy"], function() {

});

gulp.task("concat", ["concatJS", "concatCSS"], function() {

});

gulp.task("compress", function( callback ) {
    pump([
        gulp.src(["temp/js/*.js", "!temp/js/*.min.js"]),
        uglify(),
        rename( {suffix: ".min"} ),
        gulp.dest("./build/js/")
    ],
        callback
    );
});

gulp.task("compress-css", function() {
    gulp.src(["css/*.css", "!css/*.min.css"])
        .pipe(cleanCSS())
        .pipe(rename( {suffix: ".min"} ))
        .pipe(gulp.dest("build/css/"));
});

gulp.task("compress-html", function() {
    gulp.src("temp/*.html")
        .pipe(htmlmin( {collapseWhitespace: true} ))
        .pipe(gulp.dest("dist"))
});

gulp.task("min-copy", function() {
    gulp.src("./js/*.min.js")
        .pipe(gulp.dest("./build/js"));
    gulp.src("./css/*.min.css")
        .pipe(gulp.dest("./build/css"));
});

gulp.task("copy", function() {
    gulp.src("*.html")
        .pipe(gulp.dest("./temp"));
    gulp.src("css/*.css")
        .pipe(gulp.dest("temp/css/"));
});

gulp.task("concatJS", function() {
    gulp.src(["build/js/three86.min.js", "build/js/jquery-1.11.2.min.js", "build/js/TrackballControls.min.js", "build/js/bootstrap.min.js", "build/js/baseApp.min.js", "build/js/sceneConfig.min.js",
                "build/js/dates.min.js", "build/js/dataLoader.min.js", "build/js/Label.min.js", "build/js/LabelManager.min.js", "build/js/controlKit.min.js", "build/js/Detector.min.js", "build/js/FTSE.min.js"])
        .pipe(concat("build.min.js"))
        .pipe(gulp.dest("dist/js/"));
});

gulp.task("concatCSS", function() {
    gulp.src(["build/css/FTSEStyles.min.css", "build/css/bootstrap.min.css"])
        .pipe(concat("build.min.css"))
        .pipe(gulp.dest("dist/css/"));
});
