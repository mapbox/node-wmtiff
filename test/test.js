var fs = require('fs');
var path = require('path');
var tape = require('tape');
var wmtiff = require('../index.js');
var gdal = require('gdal');

function equalEnough(assert, found, expected, message) {
  found = Math.floor(found * Math.pow(10, 6)) / Math.pow(10, 6);
  expected = Math.floor(expected * Math.pow(10, 6)) / Math.pow(10, 6);
  assert.equal(found, expected, message);
}

tape('setup', function(assert) {
  var dir = path.join(__dirname, 'fixtures', 'webmercator');
  fs.mkdir(dir, function(error) {
    assert.end();
  });

});

tape('reproject', function(assert) {
  var datadir = path.join(__dirname, 'fixtures');
  fs.readdir(datadir, function(error, files) {

    filenames = files
      .filter(function(f) {
        return f.match(/.*TIF/);
      }).forEach(function(filename) {
        var srcpath = path.join(datadir, filename);
        var dstpath = path.join(datadir, 'webmercator', filename);
        var ctrlpath = path.join(datadir, 'control', filename);

        wmtiff.reproject(srcpath, dstpath);

        var original = gdal.open(srcpath);
        var src = gdal.open(dstpath);
        var ctrl = gdal.open(ctrlpath);

        for (var i = 0; i < src.geoTransform.length; i++) {
          equalEnough(assert, src.geoTransform[i], ctrl.geoTransform[i]);
        }

        assert.equal(src.bands.get(1).dataType, original.bands.get(1).dataType);

        fs.unlink(dstpath);
      });

    assert.end();
  });

});

tape('teardown', function(assert) {
  var dir = path.join(__dirname, 'fixtures', 'webmercator');
  fs.rmdir(dir, function(error) {
    assert.end();
  });

});
