// Include Gulp
var gulp = require('gulp');
var nodemon = require('nodemon');

// Include plugins
var plugins = require("gulp-load-plugins") ({
	pattern: ['gulp-*', 'gulp.*', 'main-bower-files',
				'merge-stream', 'run-sequence', 'webpack-stream'],
	replaceString: /\bgulp[\-.]/
});

// Define default destination folder
var dest = 'www/public/';

gulp.task('default', ['webpack', 'css', 'watch']);

gulp.task('setup', function(done) {
	plugins.runSequence('bower', ['webpack', 'css'], done);
});

gulp.task('bower', function() {
	return plugins.bower();
});

gulp.task('webpack', function() {
	return gulp.src('src/js/app.js')
		.pipe(plugins.webpackStream( require('./webpack.config.js')))
		.on('error', swallowError)
		.pipe(gulp.dest(dest + 'js'))
		.pipe(plugins.livereload());
});

gulp.task('css', function() {
	var lessFiles = ['src/less/*'];

	var cssStream = gulp.src(plugins.mainBowerFiles())
		.pipe(plugins.filter('**/*.css'))
		.pipe(plugins.order([
			'normalize.css',
			'*'
		]));

	var lessStream = gulp.src(plugins.mainBowerFiles().concat(lessFiles))
		.pipe(plugins.filter('*.less'))
		.pipe(plugins.less())
		.on('error', swallowError);

	return plugins.mergeStream(cssStream, lessStream)
		.pipe(plugins.concat('main.css'))
		.pipe(plugins.cleanCss())
		.on('error', swallowError)
		.pipe(gulp.dest(dest + 'css'))
		.pipe(plugins.livereload());
});

var server;

gulp.task('koa server', function (cb) {
	// plugins.nodemon({
	// 	script: 'index.js',
	// 	ext: 'js pug',
	// 	env: {'NODE_ENV': 'development'}
	// });
	server = nodemon({
		script: 'index.js',
		ext: 'js pug',
		env: {'NODE_ENV': 'development'}
	})
	.on('quit', function() {
		console.log('Press any key to exit');

		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.on('data', process.exit.bind(process, 0));
	});
});

gulp.task('watch', function() {
	plugins.livereload.listen();
	gulp.watch(['src/js/**/*.js', 'src/vue/**/*.vue'], ['webpack']);
	gulp.watch('src/less/**/*.less', ['css']);
	gulp.watch('./**/*.html').on('change', function(file) {
		plugins.livereload.changed(file.path);
	})
});

if (process.platform === "win32") {
	var rl = require("readline").createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.on("SIGINT", function () {
		process.emit("SIGINT");
	});
}

process.on('SIGINT', function () {
	server.emit('quit');
	// process.exit();
});

function swallowError(error) {
	console.log(error.toString());
	this.emit('end');
}
