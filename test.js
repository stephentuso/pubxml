'use strict'

import test from 'ava'
import pubxml from './index'
import path from 'path'
import fs from 'fs'
import pify from 'pify'
import xml2js from 'xml2js'

const expectedRes = [
  {
    type: 'color',
    values: [
      'blue',
      'green',
      'red',
      'redldrtl'
    ]
  },
  {
    type: 'drawable',
    values: [
      'xmldrawable1',
      'xmldrawable2',
      'xmldrawablev19'
    ]
  },
  {
    type: 'layout',
    values: [
      'activity_layout',
      'fragment_layout',
      'view_layout'
    ]
  }
]

test('main', t => {
  return pubxml.generatePublicXml(path.resolve(__dirname, 'test-res')).then(file => {
    const correctPath = path.resolve(__dirname, 'test-res', 'values', 'public.xml')
    t.true(fs.existsSync(file), 'public.xml exists')
    t.true(file === correctPath, 'public.xml is in correct folder')
    return pify(fs.readFile)(file, 'utf8')
  }).then(data => {
    return pify(xml2js.parseString)(data, { explicitArray: true })
  }).then(result => {
    t.truthy(result && result.resources, 'resources tag present')
    t.truthy(result.resources.public, 'public tags present')

    const values = result.resources.public
    let count = 0
    expectedRes.forEach(obj => {
      const type = obj.type
      obj.values.forEach(name => {
        const value = values[count].$
        t.true(value.type === type)
        t.true(value.name === name)
        count++
      })
    })
  })
})
