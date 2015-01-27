
var fs = require('fs');
var path = require('path');
var tape = require('tape');
var wmtiff = require('../index.js');
var gdal = require('gdal');


tape('setup', function(assert) {
  
  var dir = path.join(__dirname, 'fixtures', 'webmercator');
  fs.mkdir(dir, function(error) {
    assert.end();
  });
  
});

tape('reproject', function(assert) {
  
  var datadir = path.join(__dirname, 'fixtures');
  fs.readdir(datadir, function(error, files) {
    
    filenames = files.filter(function(f) {
      return f.match(/.*TIF/);
    });
    
    for (var i = 0; i < filenames.length; i += 1) {
      var filename = filenames[i];
      
      var srcpath = path.join(datadir, filename);
      var dstpath = path.join(datadir, 'webmercator', filename);
      var ctrlpath = path.join(datadir, 'control', filename);
      
      wmtiff.reproject(srcpath, dstpath, function(error) {
        
        var src = gdal.open(dstpath);
        var ctrl = gdal.open(ctrlpath);
        
        for (var j = 0; i < src.geoTransform.length; i += 1) {
          assert.equal(src.geoTransform[i], ctrl.geoTransform[i]);
        }
        
      });
    }
    
    
    assert.end();
  });
  
});


tape('teardown', function (test) {
  
  var dir = path.join(__dirname, 'fixtures', 'webmercator');
  fs.rmdir(dir, function(error) {
    test.end();
  });
  
});