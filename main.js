#!/usr/bin/env node

const dir = require('node-dir')
const xml2js = require('xml2js')
const pathUtil = require('path')
const fs = require('fs')

// Will be filled with names and types
// and used to generate public.xml
const publicValues = []
const publicKeys = {} // Used to prevent duplicates

// Values resource types whose children should be added to public.xml
const recursiveTypes = [
  'declare-styleable'
]

// Values resource types that shouldn't be added to public.xml
const dontAdd = [
  'declare-styleable'
]

dir.subdirs(process.cwd(), function (err, subdirs) {
  if (err) throw err
  let finished = 0
  for (let i = 0; i < subdirs.length; i++) {
    processFolder(subdirs[i], function () {
      finished++
      if (finished === subdirs.length) {
        writePublicXml()
      }
    })
  }
})

/**
 * Gets the file or dir name from a path
 */
function getLastPathComponent (path) {
  const pathComponents = path.split(pathUtil.sep)
  return pathComponents[pathComponents.length - 1]
}

function addToPublicObj (type, name) {
  if (!publicKeys[type]) {
    publicKeys[type] = {}
  }

  // Check if name was already added
  if (publicKeys[type][name]) {
    return
  }

  publicKeys[type][name] = true
  publicValues.push({
    type: type,
    name: name
  })
}

/**
 * Will process folder
 */
function processFolder (path, callback) {
  const dirName = getLastPathComponent(path)
  if (dirName.match(/^values/i)) {
    processValuesFolder(path, callback)
  } else {
    processResourceFolder(path, callback)
  }
}

/**
 * Process values folder containing resource xml files
 */
function processValuesFolder (path, callback) {
  dir.readFiles(path,
    {
      match: /\.xml$/
    },
    function (err, content, filename, next) {
      if (err) throw err

      if (getLastPathComponent(filename) === 'public.xml') {
        next()
        return
      }

      xml2js.parseString(content, { explicitArray: true }, function (err, result) {
        if (err) throw err

        if (!result || !result.resources) {
          return
        }

        processResourceXmlObj(result.resources)
      })
      next()
    },
    function (err, files) {
      if (err) throw err
      callback()
    })
}

/**
 * Uses folder name root as resource type, and
 * filenames as names
 */
function processResourceFolder (path, callback) {
  const dirName = getLastPathComponent(path)
  const resType = dirName.split('-')[0]
  dir.files(path, function (err, files) {
    if (err) throw err
    for (let i = 0; i < files.length; i++) {
      if (files[i].match(/\.xml$/i)) {
        const name = getLastPathComponent(files[i]).split('.xml')[0]
        addToPublicObj(resType, name)
      }
    }
    callback()
  })
}

/**
 * Parse the resources object created by xml2js
 */
function processResourceXmlObj (resources) {
  const resourceTypes = Object.keys(resources)
  for (let i = 0; i < resourceTypes.length; i++) {
    const type = resourceTypes[i]

    if (type === '$') {
      continue
    }

    const resType = resources[type]
    processResourceTypeArray(type, resType)
  }
}

/**
 * Parse resource type array and add to public obj
 */
function processResourceTypeArray (type, resType) {
  for (let i = 0; i < resType.length; i++) {
    const res = resType[i]

    if (!res.$) {
      continue
    }

    if (dontAdd.indexOf(type) < 0) {
      addToPublicObj(type, res.$.name)
    }

    if (recursiveTypes.indexOf(type) >= 0) {
      processResourceXmlObj(res)
    }
  }
}

function formatPublicObject () {
  // Reformat public array to match xml2js format
  const formattedPublic = {
    resources: {
      public: []
    }
  }
  for (let i = 0; i < publicValues.length; i++) {
    formattedPublic.resources.public.push({
      '$': publicValues[i]
    })
  }
  return formattedPublic
}

function buildXml (object) {
  const builder = new xml2js.Builder()
  return builder.buildObject(object)
}

function writePublicXml () {
  const formatted = formatPublicObject()
  const xml = buildXml(formatted)
  const outDir = process.cwd() + pathUtil.sep + 'values'
  const outFile = outDir + pathUtil.sep + 'public.xml'
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir)
  }
  fs.writeFile(outFile, xml, function (err) {
    if (err) throw err
    console.log('Successfully wrote public resources to ' + outFile)
  })
}
