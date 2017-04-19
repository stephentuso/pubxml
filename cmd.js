#!/usr/bin/env node
const pubxml = require('./index')
pubxml.generatePublicXml(process.cwd()).then(file => {
  console.log('Successfully wrote public resources to ' + file)
})
