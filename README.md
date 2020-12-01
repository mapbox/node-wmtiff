# Web Mercator Tiff

Reproject a TIFF into web mercator using [`node-gdal`](https://github.com/naturalatlas/node-gdal/).

[![Build Status](https://travis-ci.com/mapbox/node-wmtiff.svg?branch=master)](https://travis-ci.com/mapbox/node-wmtiff)

### Usage

On the command line:

    wmtiff [srcpath] [dstpath]

In node:

    var wmtiff = require('wmtiff');
    var path = require('path');

    var srcpath = path.join('path', 'to', 'source', 'image');
    var dstpath = path.join('path', 'to', 'destination', 'image');

    wmtiff.reproject(srcpath, dstpath);
