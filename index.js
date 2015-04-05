
var gdal = require('gdal');

module.exports = {};
module.exports.reproject = reproject;

function getNoDataValues(src) {

  var bands = Array.apply(null, {length: src.bands.count()}).map(Number.call, Number);

  return bands.map(function(idx) {
    return src.bands.get(idx + 1).noDataValue;
  });

}

function getColorInterpretation(src) {

  var bands = Array.apply(null, {length: src.bands.count()}).map(Number.call, Number);

  return bands.map(function(idx) {
    return src.bands.get(idx + 1).colorInterpretation;
  });
}

function reproject(srcpath, dstpath) {
  var src = gdal.open(srcpath);

  var bandCount = src.bands.count();
  var dataType = src.bands.get(1).dataType;

  var options = {
    src: src,
    s_srs: src.srs,
    t_srs: gdal.SpatialReference.fromEPSG(3857)
  };

  var info = gdal.suggestedWarpOutput(options);

  options.dst = gdal.open(dstpath, 'w', 'GTiff', info.rasterSize.x, info.rasterSize.y, bandCount, dataType);
  options.dst.geoTransform = info.geoTransform;

  gdal.reprojectImage(options);

  var colorInterps = getColorInterpretation(src);
  var noDataValues = getNoDataValues(src);

  options.dst.bands.forEach(function(band) {
    band.colorInterpretation = colorInterps[band.id - 1];
    band.noDataValue = noDataValues[band.id - 1];
  });

  src.close();
  options.dst.close();
}
