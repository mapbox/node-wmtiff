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


var domains = [
  'IMAGE_STRUCTURE',
  'SUBDATASETS',
  'GEOLOCATION',
  'RPC'
];

function generateMeta(dataset) {
  var meta = dataset.getMetadata();
  domains.forEach(function(domain) {
      meta[domain] = dataset.getMetadata(domain);
  });
  return meta;
}


tape('reproject', function(assert) {
  var datadir = path.join(__dirname, 'fixtures');
  var sm = gdal.SpatialReference.fromEPSG(3857);

  fs.readdir(datadir, function(error, files) {

    filenames = files
      .filter(function(f) {
        return f.match(/.*TIF/);
      }).forEach(function(filename) {
        // src is original
        var srcpath = path.join(datadir, filename);
        var srcpath_meta = srcpath.replace(path.extname(filename),'.meta');
        // dst is our output (cleaned up below)
        var dstpath = path.join(datadir, 'webmercator', filename);
        // control is generated with gdalwarp
        var ctrlpath = path.join(datadir, 'control', filename);

        wmtiff.reproject(srcpath, dstpath);

        var original = gdal.open(srcpath);
        var src = gdal.open(dstpath);
        var ctrl = gdal.open(ctrlpath);

        for (var i = 0; i < src.geoTransform.length; i++) {
          equalEnough(assert, src.geoTransform[i], ctrl.geoTransform[i], 'correct geoTransform');
        }

        var src_meta = generateMeta(src);
        // We set BAND, so we expect that to be respected
        assert.deepEqual(src_meta['IMAGE_STRUCTURE']['INTERLEAVE'],'BAND');
        // We don't set compression, so we expect GDAL will by default drop it
        assert.deepEqual(src_meta['IMAGE_STRUCTURE']['COMPRESSION'],undefined);
        // We set the tiling block size, so we expect that to be respected
        var new_band = src.bands.get(1);
        var og_band = original.bands.get(1);
        assert.equal(new_band.dataType, og_band.dataType, 'correct datatype');
        assert.deepEqual(new_band.blockSize, {x:512,y:512}, 'correct blocksize');
        assert.ok(src.srs.isSame(sm), 'has projection information');

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
