// import modules
var gulp = require('gulp');
var data = require('gulp-data');
var del = require('del'); // rm -rf
var gutil = require('gulp-util');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var uncss = require('gulp-uncss');
var size = require('gulp-size');
var notify = require('gulp-notify');
var minifyHTML = require('gulp-minify-html');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var cmq = require('gulp-combine-media-queries');
var ghPages = require('gulp-gh-pages');
var es = require('event-stream');var sass = require('gulp-sass');
var template = require('gulp-template');
var argv = require('yargs').argv;

// declaration of source files
var sources = {
    css : [
        'src/css/font-awesome.min.css',
        'src/css/bootstrap.min.css',
        'src/css/main.css'
    ],
    js : {
        all : [
            'src/js/jquery.min.js',
            'src/js/bootstrap.min.js',
            'src/js/countUp.min.js',
            'src/js/wow.min.js',
            'src/js/main.js'
        ],
        ie : [
            'src/js/html5shiv.js',
            'src/js/respond.min.js'
        ]
    },
    sass : [
        'src/sass/**/*'
    ],
    html : [
        'src/index.html'
    ],
    fonts : [
        'src/fonts/*'
    ],
    images : [
        'src/img/**/*'
    ],
    others : [
        'src/robots.txt',
        'src/humans.txt'
    ]
};

// declaration of target files
var target = {
    js : {
        dir : 'dist/js',
        name : {
            all : 'all.js',
            ie : 'ie.js'
        }
    },
    css : {
        dir : 'dist/css',
        name : 'all.css'
    },
    html : {
        dir : 'dist/'
    },
    fonts : {
        dir : 'dist/fonts'
    },
    images : {
        dir : 'dist/img'
    },
    others : {
        dir: 'dist/'
    }
};

// template data
var templateData = {
    misc : {
        calendar : (new Date()).toLocaleDateString(),
        clock : (new Date()).toLocaleTimeString()
    }
};

// utility function to display size notifications
var sizeChangeMessageCallBack = function(preSize, postSize, title) {
    return function () {
        var compression = 1.0 - postSize.size / preSize.size;
        var message = "";
        if (title) {
            message += title + " ";
        }
        message += preSize.prettySize + ' -> ' + postSize.prettySize;
        message += " (" + (compression * 100).toFixed(1) + "% compression rate)";
        return message;
    };
};

// Environment configuration
var environment = {
    development : false,
    production : false
};

// if flag "-p" present, then load production environment
if (argv.p) {
    environment.production = true;
} else { // otherwise, as default set development environment
    environment.development = true;
}

gulp.task('html', ['clean'], function() {
    var preSize = size();
    var postSize = size();
    var stream =  gulp.src(sources.html)
        .pipe(preSize);
    if (environment.production) {
        stream = stream.pipe(minifyHTML());
    }
    stream = stream.pipe(postSize)
        .pipe(gulp.dest(target.html.dir))
        .pipe(notify({
            onLast: true,
            title: 'HTML compression',
            message: sizeChangeMessageCallBack(preSize, postSize)
        }));
    return stream;
});
gulp.task('fonts', ['clean'], function() {
    return gulp.src(sources.fonts)
        .pipe(gulp.dest(target.fonts.dir));
});
gulp.task('img', ['clean'], function() {
    var preSize = size();
    var postSize = size();
    return gulp.src(sources.images)
        .pipe(preSize)
        .pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))
        .pipe(postSize)
        .pipe(gulp.dest(target.images.dir))
        .pipe(notify({
            onLast: true,
            title: 'Img compression',
            message: sizeChangeMessageCallBack(preSize, postSize)
        }));
});
gulp.task('css', ['clean'], function() {
    var preSize = size();
    var postSize = size();
    var sassStream = gulp.src(sources.sass)
        .pipe(sass());
    var cssStream = gulp.src(sources.css);
    var stream = es.merge(cssStream, sassStream)
        .pipe(preSize)
        .pipe(concat(target.css.name));
    if (environment.production) {
        stream = stream.pipe(cmq())
            .pipe(uncss({html: sources.html}))
            .pipe(minifyCSS());
    }
    stream = stream.pipe(postSize)
        .pipe(gulp.dest(target.css.dir))
        .pipe(notify({
            onLast: true,
            title: 'CSS compression',
            message: sizeChangeMessageCallBack(preSize, postSize)
        }));
    return stream;
});
gulp.task('js', ['clean'], function() {
    var preSize = size();
    var postSize = size();
    var jsStream = gulp.src(sources.js.all)
        .pipe(concat(target.js.name.all));
    var ieJsStream = gulp.src(sources.js.ie)
        .pipe(concat(target.js.name.ie));
    var stream = es.merge(jsStream, ieJsStream)
        .pipe(preSize);
    if (environment.production) {
        stream = stream.pipe(uglify());
    }
        stream = stream.pipe(gulp.dest(target.js.dir))
        .pipe(postSize)
        .pipe(notify({
            onLast: true,
            title: 'JS compression',
            message: sizeChangeMessageCallBack(preSize, postSize)
        }));
    return stream;
});

gulp.task('others', ['clean'], function() {
    return gulp.src(sources.others)
        .pipe(data(templateData))
        .pipe(template())
        .pipe(gulp.dest(target.others.dir));
});

gulp.task('commit', ['build'], function() {
    var stream = gulp.src('dist/**/*');
    if (environment.development) {
        gutil.log("Development environment has not a deploy profile");
        return stream
            .pipe(gutil.noop());
    } else if (environment.production) {
        return stream
            .pipe(ghPages({branch : "gh-pages"}));
    }
});

gulp.task('build', ['others','html', 'img', 'css', 'js', 'fonts']);

gulp.task('clean', function(cb) {
    del(['dist/'], cb);
});

gulp.task('default', ['build']);

gulp.task('deploy', ['build', 'commit']);
