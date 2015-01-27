
var gdal = require('gdal');

module.exports = {};
module.exports.reproject = reproject;


function getSpatialResolution(srcProjection, dstProjection, srcWidth, srcHeight, srcAffine) {
  
  var transform = new gdal.CoordinateTransformation(srcProjection, dstProjection);
  var srcDiagonal = new gdal.LineString();
  
  srcDiagonal.points.add(srcAffine[0], srcAffine[3]);
  srcDiagonal.points.add(srcAffine[0] + srcAffine[1] * srcWidth, srcAffine[3] + srcAffine[5] * srcHeight);
  
  var dstDiagonal = srcDiagonal.clone();
  dstDiagonal.transform(transform);
  
  var nPixels = Math.sqrt(srcWidth * srcWidth + srcHeight * srcHeight);
  
  return dstDiagonal.getLength() / nPixels;
}


function getExtent(srcProjection, dstProjection, srcWidth, srcHeight, srcAffine) {
  
  var transform = new gdal.CoordinateTransformation(srcProjection, dstProjection);
  
  var ul = transform.transformPoint(srcAffine[0], srcAffine[3]);
  var ur = transform.transformPoint(srcAffine[0] + srcAffine[1] * srcWidth, srcAffine[3]);
  var lr = transform.transformPoint(srcAffine[0] + srcAffine[1] * srcWidth, srcAffine[3] + srcAffine[5] * srcHeight);
  var ll = transform.transformPoint(srcAffine[0], srcAffine[3] + srcAffine[5] * srcHeight);
  
  return {
    minX: Math.min(ll.x, ul.x),
    minY: Math.min(ll.y, lr.y),
    maxX: Math.max(ur.x, lr.x),
    maxY: Math.max(ul.y, ur.y)
  };
}


function getNoDataValues(src) {
  
  var bands = Array.apply(null, {length: src.bands.count()}).map(Number.call, Number);
  
  return bands.map(function(idx) {
    return src.bands.get(idx + 1).noDataValue;
  });
  
}


function reproject(srcpath, dstpath, callback) {
  
  var src = gdal.open(srcpath);
  
  var width = src.rasterSize.x;
  var height = src.rasterSize.y;
  var bandCount = src.bands.count();
  var driver = src.driver.description;
  var srcAffine = src.geoTransform;
  var srcProjection = src.srs;
  
  var dstProjection = gdal.SpatialReference.fromUserInput('EPSG:3857');
  
  var dstExtent = getExtent(srcProjection, dstProjection, width, height, srcAffine);
  var dstResolution = getSpatialResolution(srcProjection, dstProjection, width, height, srcAffine);
  
  var dstWidth = ~~((dstExtent.maxX - dstExtent.minX) / dstResolution + 0.5);
  var dstHeight = ~~((dstExtent.maxY - dstExtent.minY) / dstResolution + 0.5);
  
  var dst = gdal.open(dstpath, mode='w', 'GTiff', dstWidth, dstHeight, bandCount, gdal.GDT_UInt16);
  dst.srs = dstProjection;
  dst.geoTransform = [dstExtent.minX, dstResolution, srcAffine[2], dstExtent.maxY, srcAffine[4], -dstResolution];
  
  var noDataValues = getNoDataValues(src);
  dst.bands.forEach(function(band) {
    band.noDataValue = noDataValues[band.id - 1];
  });
  
  var opts = {
    src: src,
    dst: dst,
    s_srs: srcProjection,
    t_srs: dstProjection
  };
  gdal.reprojectImage(opts);
  
  src.close();
  dst.close();
  
  return callback(null);
}