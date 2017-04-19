#!/usr/bin/env node
require('./index').generatePublicXml(process.cwd()).then(file => {
  console.log('Successfully wrote public resources to ' + file)
})
