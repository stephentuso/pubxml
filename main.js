#!/usr/bin/env node

var dir = require('node-dir');
var xml2js = require('xml2js');
var pathUtil = require('path');
var fs = require('fs');

//Will be filled with names and types
// and used to generate public.xml
var public = [];
var publicKeys = {}; //Used to prevent duplicates

//Values resource types whose children should be added to public.xml
var recursiveTypes = [
	"declare-styleable"
]

//Values resource types that shouldn't be added to public.xml
var dontAdd = [
	"declare-styleable"
]

dir.subdirs(process.cwd(), function(err, subdirs) {
    if (err) throw err;
	var finished = 0;
	for (var i = 0; i < subdirs.length; i++) {
		processFolder(subdirs[i], function() {
			finished++;
			if (finished == subdirs.length) {
				writePublicXml();
			}
		});
	}
});

/**
 * Gets the file or dir name from a path
 */
function getLastPathComponent(path) {
	var pathComponents = path.split(pathUtil.sep);
	return pathComponents[pathComponents.length - 1];
}

function addToPublicObj(type, name) {

	if (!publicKeys[type]) {
		publicKeys[type] = {};
	}

	//Check if name was already added
	if (publicKeys[type][name]) {
		return;
	}

	publicKeys[type][name] = true;
	public.push({
		type: type,
		name: name
	});
}

/**
 * Will process folder
 */
function processFolder(path, callback) {
	var dirName = getLastPathComponent(path);
	if (dirName.match(/^values/i)) {
		processValuesFolder(path, callback);
	} else {
		processResourceFolder(path, callback);
	}
}

/**
 * Process values folder containing resource xml files
 */
function processValuesFolder(path, callback) {
	dir.readFiles(path, {
	    	match: /\.xml$/
	},
		function(err, content, filename, next) {
	    	if (err) throw err;

			if (getLastPathComponent(filename) == "public.xml") {
				next();
				return;
			}

			xml2js.parseString(content, { explicitArray: true }, function(err, result) {
				if (err) throw err;

				if (!result) {
					return;
				}

				var resources = result.resources;

				if (!resources) {
					return;
				}

				processResourceXmlObj(resources);
			});
			next();
	    },
	    function(err, files){
	        if (err) throw err;
			callback();
	    });
}

/**
 * Uses folder name root as resource type, and
 * filenames as names
 */
function processResourceFolder(path, callback) {
	var dirName = getLastPathComponent(path);
	var resType = dirName.split('-')[0];
	dir.files(path, function(err, files) {
		if (err) throw err;
		for (var i = 0; i < files.length; i++) {
			if (files[i].match(/\.xml$/i)) {
				var name = getLastPathComponent(files[i]).split('.xml')[0];
				addToPublicObj(resType, name);
			}
		}
		callback();
	});
}

/**
 * Parse the resources object created by xml2js
 */
function processResourceXmlObj(resources) {
	var resourceTypes = Object.keys(resources);
	for (var i = 0; i < resourceTypes.length; i++) {
		var type = resourceTypes[i];

		if (type == "$") {
			continue;
		}

		var resType = resources[type];
		processResourceTypeArray(type, resType);
	}
}

/**
 * Parse resource type array and add to public obj
 */
function processResourceTypeArray(type, resType) {
	for (var i = 0; i < resType.length; i++) {

		var res = resType[i];

		if (!res.$) {
			continue;
		}

		if (dontAdd.indexOf(type) < 0) {
			addToPublicObj(type, res.$.name);
		}

		if (recursiveTypes.indexOf(type) >= 0) {
			processResourceXmlObj(res);
		}

	}
}

function formatPublicObject() {
	//Reformat public array to match xml2js format
	var formattedPublic = {
		resources: {
			public: []
		}
	};
	for (var i = 0; i < public.length; i++) {
		formattedPublic.resources.public.push({
			"$": public[i]
		});
	}
	return formattedPublic;
}

function buildXml(object) {
	var builder = new xml2js.Builder();
	return builder.buildObject(object);
}

function writePublicXml() {
	var formatted = formatPublicObject();
	var xml = buildXml(formatted);
	var pathComp = [process.cwd(), "values", "public.xml"];
	var outDir = process.cwd() + pathUtil.sep + "values";
	var outFile = outDir + pathUtil.sep + "public.xml";
	if (!fs.existsSync(outDir)){
    	fs.mkdirSync(outDir);
	}
	fs.writeFile(outFile, xml, function(err) {
		if (err) throw err;
		console.log("Successfully wrote public resources to " + outFile);
	});
}
