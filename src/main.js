'use strict'
let http = require('http')
let log = require('./log')

module.exports = class ExpectSrv {
  constructor (options) {
    this._port = options.port
    this._server = http.createServer((req, res) => {
      this._handleRequest(req, res)
    })
    this._expectations = []
    this.errors = []
  }

  _handleRequest (req, res) {
    this._collectBody(req)
        .then(() => {
          let requestHandled = false
          for (let expectation of this._expectations) {
            if (!this._acceptableExpectation(expectation, req)) continue
            this._handleExpectation(expectation, req, res)
            requestHandled = true
            break
          }
          if (!requestHandled) res.writeHead(404)
          res.end()
        })
        .catch(() => {
          res.writeHead(500)
          res.end()
        })
  }

  _acceptableExpectation (expectation, req) {
    log('trying expectation', expectation)
    return expectation.accept && expectation.accept(req)
  }

  _handleExpectation (expectation, req, res) {
    log('accepted expectation', expectation)
    if (expectation.valid && !expectation.valid(req)) {
      log('expectation invalid', expectation)
      this.errors.push(expectation)
    }
    let response = expectation.respond ? expectation.respond(req, res) : undefined
    if (typeof response !== 'undefined') {
      log('sending expectation response', response)
      this._sendResponse(res, response)
    }
    if (!expectation.repeat || !expectation.repeat(res)) {
      let index = this._expectations.findIndex(e => e === expectation)
      log('removing expectation', expectation)
      this._expectations.splice(index, 1)
    }
  }

  _sendResponse (serverResponse, expectationResponse) {
    serverResponse.write(JSON.stringify(expectationResponse))
    serverResponse.end()
  }

  // this just reads the whole body.
  // not good for production, but fine for tests
  _collectBody (request) {
    return new Promise((resolve, reject) => {
      let bufs = []
      request.on('data', chunk => bufs.push(chunk))
      request.on('end', () => {
        let str = Buffer.concat(bufs).toString('utf8')
        try {
          request.body = JSON.parse(str)
        } catch (e) {
          request.body = str
        }
        resolve()
      })
      request.on('error', reject)
    })
  }

  expect (expectation) {
    this._expectations.push(expectation)
  }

  get (path, responseSpec) {
    this.expect({
      accept () { return true },
      respond (req, res) {
        res.writeHead(responseSpec.statusCode || 200, responseSpec.headers)
        return responseSpec.body
      },
      valid (req) {
        return req.url === path &&
                req.method === 'GET'
      }
    })
  }

  post (path, incomingExpectation, responseSpec) {
    this.expect({
      accept () { return true },
      respond (req, res) {
        res.writeHead(responseSpec.statusCode || 200, responseSpec.headers)
        return responseSpec.body
      },
      valid (req) {
        return req.url === path &&
                req.method === 'POST' &&
                req.body === incomingExpectation.body
      }
    })
  }

  listen () {
    return new Promise((resolve) => {
      this._server.listen(this._port, () => {
        log('listening')
        resolve()
      })
    })
  }

  validate () {
    if (this.errors.length) {
      throw new Error('expectations failed: ' + this.errors.join(', '))
    }
  }

  allExpectationsMatched () {
    if (this._expectations.length) {
      throw new Error('not all expectations have been matched' + this._expectations.join(', '))
    }
  }

  close () {
    this._server.close()
  }
}
