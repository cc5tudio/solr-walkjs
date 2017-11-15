(function () {
  "use strict";
 
  var walk = require('walk')
    , fs = require('fs')
    , options
    , walker
    ;

  var urlencode = require('urlencode');

  var srcDir = process.argv[2];
  var solrCoreName = process.argv[3];
  var solrRootPath = process.argv[4];
 
  options = {
    followLinks: false
    // directories with these keys will be skipped 
  , filters: ["Temp", "_Temp"]
  };
 
  walker = walk.walk(srcDir, options);
 
  walker.on("names", function (root, nodeNamesArray) {
    nodeNamesArray.sort(function (a, b) {
      if (a > b) return 1;
      if (a < b) return -1;
      return 0;
    });
  });
 
  walker.on("directory", function (root, dirStatsArray, next) {
    // dirStatsArray is an array of `stat` objects with the additional attributes 
    // * type 
    // * error 
    // * name 
    
    //console.log('Directory: '+root+dirStatsArray.name);
    next();
  });

  var solrKeywordsLiteral;
 
  walker.on("file", function (root, fileStats, next) {
    if(!fileStats.name.startsWith('.'))
    {
        if(fileStats.name === 'Keywords.txt')
        {
            //console.log(root.replace(/(\s+|&)/g,'\\$1')+'/'+fileStats.name);
            //fs.readFile(fileStats.name,'utf8', function (err, data) {
            //var fullFilePath = root.replace(/(\s+|&)/g, '\\$1')+'/'+fileStats.name;
            var fullFilePath = root+'/'+fileStats.name;

            fs.readFile(fullFilePath,'utf8', function (err, data) {
                if (err) {
                    return console.log(err);
                }

                //console.log(data);

                solrKeywordsLiteral = data.split(",").map(function(e) {
                                                        e = urlencode(e.trim());
                                                        return e;

                                                        }).join("&literal.keywords=");

                next();
            });
        } else {

            var truncatedPath = root.slice(root.indexOf('Write-Ups')+9,root.length);
            var solrServiceAreaLiteral = truncatedPath.split("/").map(function(e) {
                                                        e =  urlencode(e.trim());
                                                        return e;
            }).join("&literal.service_areas=");

            var resourceName = "&literal.resourcename="+urlencode(fileStats.name);

            var filePath = root.replace(/(\s+|&)/g, '\\$1')+'/'+fileStats.name.replace(/(\s+|&)/g, '\\$1');
            console.log(solrRootPath+'bin/post -c '+solrCoreName+' '+filePath+' -params "'+solrKeywordsLiteral+solrServiceAreaLiteral+resourceName+'"');
            console.log();

            next();

        }


    } else {

	next();
    }
  });
 
  walker.on("errors", function (root, nodeStatsArray, next) {
    next();
  });
 
  walker.on("end", function () {
    console.log("#all done");
  });
}());
