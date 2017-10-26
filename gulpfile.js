var gulp = require("gulp");
var babel = require("gulp-babel");

gulp.task("build", ["compile", "min-copy"], function() {

});

gulp.task("compile", function() {
    return gulp.src(["./js/*.js", "!./js/*.min.js"])
        .pipe(babel())
        .pipe(gulp.dest("./dist/js"));
});

gulp.task("min-copy", function() {
    return gulp.src("./js/*.min.js")
        .pipe(gulp.dest("./dist/js"))
});

gulp.task("copy", function() {
    gulp.src("*.html")
        .pipe(gulp.dest("./dist"));
    gulp.src("css/*.css")
        .pipe(gulp.dest("dist/css/"))
});
