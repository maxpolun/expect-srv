let http = require('http')
let parse = require('url').parse

function consumeBody (stream) {
  return new Promise((resolve, reject) => {
    let bufs = []
    stream.on('data', (chunk) => bufs.push(chunk))
    stream.on('end', () => {
      let str = Buffer.concat(bufs).toString('utf8')
      let result
      try {
        result = JSON.parse(str)
      } catch (e) {
        result = str
      }
      stream.body = result
      resolve(stream)
    })
    stream.on('error', reject)
  })
}

module.exports.get = url => new Promise((resolve, reject) => {
  http.get(url, res => {
    consumeBody(res).then(resolve)
  }).on('error', reject)
})

module.exports.request = (url, body, config) => new Promise((resolve, reject) => {
  let options = Object.assign({}, parse(url), config)
  let req = http.request(options, res => {
    consumeBody(res).then(resolve)
  })
  req.on('error', reject)
  if (body) {
    req.write(JSON.stringify(body))
  }
  req.end()
})
