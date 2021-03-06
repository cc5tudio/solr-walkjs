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
    
    next();
  });

  var keywordsHash = {

  }
 
  walker.on("file", function (root, fileStats, next) {
    if(!fileStats.name.startsWith('.'))
    {
        if(fileStats.name === 'Keywords.txt')
        {
            var fullFilePath = root+'/'+fileStats.name;

            fs.readFile(fullFilePath,'utf8', function (err, data) {
                if (err) {
                    return console.log(err);
                }

                var solrKeywordsLiteral = "literal.keywords=" + data.split(",").map(function(e) {

                                                        e = urlencode(e.trim()).toLowerCase();
                                                        return e;

                                                        }).join("&literal.keywords=");

                // We need this to make sure we properly associate the keywords listed in the Keywords.txt file
                // in the same directory as the file are properly associated
                keywordsHash[root] = solrKeywordsLiteral;

                next();
            });
        } else {

            var truncatedPath = root.slice(root.indexOf('Write-Ups')+9,root.length);
            var solrServiceAreaLiteral = truncatedPath.split("/").map(function(e) {
                                                        e =  urlencode(e.trim());
                                                        return e;
            }).join("&literal.service_areas=");

            var solrServiceAreaDescendentPath = "&literal.service_area_descendent_path="+urlencode(truncatedPath);

            var resourceName = "&literal.resourcename="+urlencode(fileStats.name);

            var filePath = root.replace(/(\s+|&)/g, '\\$1')+'/'+fileStats.name.replace(/(\s+|&)/g, '\\$1');

            if(typeof(keywordsHash[root]) == "undefined" && fileStats.name.indexOf("Icon") < 0){
                console.log(filePath);
                fs.readFile(root+'/Keywords.txt','utf8', function (err, data) {
                    if (err) {
                        return console.log(err);
                    }

                    var solrKeywordsLiteral = "literal.keywords=" + data.split(",").map(function(e) {
                            e = urlencode(e.trim()).toLowerCase();
                            return e;

                        }).join("&literal.keywords=");

                    // We need this to make sure we properly associate the keywords listed in the Keywords.txt file
                    // in the same directory as the file are properly associated
                    keywordsHash[root] = solrKeywordsLiteral;

                    console.log(solrRootPath+'bin/post -c '+solrCoreName+' '+filePath+' -params "'+keywordsHash[root]+solrServiceAreaLiteral+resourceName+solrServiceAreaDescendentPath+'"');

                    next();
                });
            } else {
                console.log(solrRootPath+'bin/post -c '+solrCoreName+' '+filePath+' -params "'+keywordsHash[root]+solrServiceAreaLiteral+resourceName+solrServiceAreaDescendentPath+'"');
                next();
            }

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
