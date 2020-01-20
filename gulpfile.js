var gulp         = require('gulp'),
    sass         = require('gulp-sass'),
    browserSync  = require('browser-sync').create(),
    concat       = require('gulp-concat'),
    uglify       = require('gulp-uglify-es').default,
    cleancss     = require('gulp-clean-css'),
    autoprefixer = require('gulp-autoprefixer'),
    rsync        = require('gulp-rsync'),
    newer        = require('gulp-newer'),
    rename       = require('gulp-rename'),
    responsive   = require('gulp-responsive'),
    del          = require('del'),

    pug               = require('gulp-pug'), //pug    
    notify            = require("gulp-notify"), //для pug
    fs                = require('fs');    //для pug

// Local Server
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: 'app'
    },
    notify: false,
    // online: false, // Work offline without internet connection
    // tunnel: true, tunnel: 'projectname', // Demonstration page: http://projectname.localtunnel.me
  })
});
function bsReload(done) { browserSync.reload(); done(); };

// Custom Styles
gulp.task('styles', function() {
  return gulp.src('app/sass/**/*.sass')
  .pipe(sass({
    outputStyle: 'expanded',
    includePaths: [__dirname + '/node_modules']
  }))
  .pipe(concat('styles.min.css'))
  .pipe(autoprefixer({
    grid: true,
    overrideBrowserslist: ['last 10 versions']
  }))
  .pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Optional. Comment out when debugging
  .pipe(gulp.dest('app/css'))
  .pipe(browserSync.stream())
});

// Scripts & JS Libraries
gulp.task('scripts', function() {
  return gulp.src([
    // 'node_modules/jquery/dist/jquery.min.js', // Optional jQuery plug-in (npm i --save-dev jquery)
    'app/js/_libs.js', // JS libraries (all in one)
    'app/js/_custom.js', // Custom scripts. Always at the end
    ])
  .pipe(concat('scripts.min.js'))
  .pipe(uglify()) // Minify js (opt.)
  .pipe(gulp.dest('app/js'))
  .pipe(browserSync.reload({ stream: true }))
});

// Responsive Images
var quality = 95; // Responsive images quality

// Produce @1x images
gulp.task('img-responsive-1x', async function() {
  return gulp.src('app/img/_src/**/*.{png,jpg,jpeg,webp,raw}')
    .pipe(newer('app/img/@1x'))
    .pipe(responsive({
      '**/*': { width: '50%', quality: quality }
    })).on('error', function (e) { console.log(e) })
    .pipe(rename(function (path) {path.extname = path.extname.replace('jpeg', 'jpg')}))
    .pipe(gulp.dest('app/img/@1x'))
});
// Produce @2x images
gulp.task('img-responsive-2x', async function() {
  return gulp.src('app/img/_src/**/*.{png,jpg,jpeg,webp,raw}')
    .pipe(newer('app/img/@2x'))
    .pipe(responsive({
      '**/*': { width: '100%', quality: quality }
    })).on('error', function (e) { console.log(e) })
    .pipe(rename(function (path) {path.extname = path.extname.replace('jpeg', 'jpg')}))
    .pipe(gulp.dest('app/img/@2x'))
});
gulp.task('img', gulp.series('img-responsive-1x', 'img-responsive-2x', bsReload));

// Clean @*x IMG's
gulp.task('cleanimg', function() {
  return del(['app/img/@*'], { force: true })
});

// Code & Reload
gulp.task('code', function() {
  return gulp.src('app/**/*.html')
  .pipe(browserSync.reload({ stream: true }))
});
// pug
gulp.task('code', function() {
  return gulp.src('app/pug/**/*.pug')
  .pipe(pug({
     locals : {
          nav: JSON.parse(fs.readFileSync('./app/data/navigation.json', 'utf8')),
          content: JSON.parse(fs.readFileSync('./app/data/content.json', 'utf8')),
      },
      pretty: true
  }))
  // .on("error", notify.onError())
  .on('error', notify.onError(function(error) {
    return {
        title   : 'Pug',
        message : error.message
    }
  }))
  .pipe(gulp.dest('app'))
  .pipe(browserSync.reload({stream: true}));
});

// Deploy
gulp.task('rsync', function() {
  return gulp.src('app/')
  .pipe(rsync({
    root: 'app/',
    hostname: 'username@yousite.com',
    destination: 'yousite/public_html/',
    // include: ['*.htaccess'], // Included files
    exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excluded files
    recursive: true,
    archive: true,
    silent: false,
    compress: true
  }))
});

gulp.task('watch', function() {
  gulp.watch('app/sass/**/*.sass', gulp.parallel('styles'));
  gulp.watch(['app/js/_custom.js', 'app/js/_libs.js'], gulp.parallel('scripts'));
  gulp.watch('app/pug/**/*.pug', gulp.parallel('code'));
  gulp.watch('app/*.html', gulp.parallel('code'));
  gulp.watch('app/img/_src/**/*', gulp.parallel('img'));
});

gulp.task('default', gulp.parallel('img', 'styles', 'scripts', 'browser-sync', 'watch'));
