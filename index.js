var bower = require('bower');
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');
var walk = require('walk');

module.exports = function () {
	var stream = through.obj(function(file, enc, callback) {
		this.push(file);
		callback();
	});

	bower.commands.install()
		.on('error', function(error) {
			stream.emit('error', new gutil.PluginError('gulp-bower', error));
			stream.end();
		})
		.on('end', function() {
			var dir = './bower_components';

			var walker = walk.walk(dir);
			walker.on("errors", function(root, stats, next) {
				stream.emit('error', new gutil.PluginError('gulp-bower', stats.error));
				next();
			});
			walker.on("directory", function(root, stats, next) {
				next();
			});
			walker.on("file", function(root, stats, next) {
				var filePath = path.resolve(root, stats.name);

				fs.readFile(filePath, function(error, data) {
					if (error)
						stream.emit('error', new gutil.PluginError('gulp-bower', error));
					else
						stream.write(new gutil.File({
							path: path.relative(dir, filePath),
							contents: data
						}));

					next();
				});
			});
			walker.on("end", function() {
				stream.end();
			});
		});

	return stream;
};