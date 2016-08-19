
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

  var cpus = require('os').cpus().length;

  var warp_cache_max = 750; //MB
  var gdal_cache_max = warp_cache_max * 3;

  gdal.config.set('GDAL_CACHEMAX', gdal_cache_max.toString());

  var src = gdal.open(srcpath);

  var bandCount = src.bands.count();
  var dataType = src.bands.get(1).dataType;

  try {
    src.srs.autoIdentifyEPSG();
  } catch(err) {
    throw err;
  }

  var options = {
    src: src,
    s_srs: src.srs,
    t_srs: gdal.SpatialReference.fromEPSG(3857),
    memoryLimit: warp_cache_max * 1024 * 1024,
    multi: true,
    options: ['NUM_THREADS=' + cpus.toString()]
  };

  var info = gdal.suggestedWarpOutput(options);

  var creationOptions = [
    'TILED=YES',
    'BLOCKXSIZE=512',
    'BLOCKYSIZE=512'
  ];

  options.dst = gdal.open(
    dstpath, 'w', 'GTiff',
    info.rasterSize.x, info.rasterSize.y,
    bandCount,
    dataType,
    creationOptions
  );

  options.dst.geoTransform = info.geoTransform;
  options.dst.srs = options.t_srs;

  gdal.reprojectImage(options);

  var colorInterps = getColorInterpretation(src);
  var noDataValues = getNoDataValues(src);

  options.dst.bands.forEach(function(band) {
    band.colorInterpretation = colorInterps[band.id - 1];
    band.noDataValue = noDataValues[band.id - 1];
  });

  src.close();
  options.dst.close();

  //safe measure to quickly release gdal's reference to the dataset
  //needed if the dataset is processed by another tool immediately afterwards
  src = null;
  options.dst = null;
}
