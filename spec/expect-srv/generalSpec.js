'use strict'
let ExpectSrv = require('../../index')
let http = require('../support/http')
describe('server.expect', () => {
  let server
  beforeEach((done) => {
    server = new ExpectSrv({
      port: 8888
    })
    server.listen().then(done).catch(done.fail)
  })

  afterEach(() => {
    server.close()
  })

  it('will handle acceptable responses', (done) => {
    server.expect({
      accept () { return true }
    })
    http.get('http://localhost:8888')
        .then(res => expect(res.statusCode).toEqual(200))
        .then(done)
        .catch(done.fail)
  })

  it('will not handle unacceptable responses', (done) => {
    server.expect({
      accept () { return false }
    })
    http.get('http://localhost:8888')
      .then(res => expect(res.statusCode).toEqual(404))
      .then(done)
      .catch(done.fail)
  })

  it('can respond', (done) => {
    server.expect({
      accept () { return true },
      respond () {
        return {ok: true}
      }
    })
    http.get('http://localhost:8888')
        .then(res => expect(res.body).toEqual({ok: true}))
        .then(done)
        .catch(done.fail)
  })

  it('can do anything to the response in respond()', (done) => {
    server.expect({
      accept () { return true },
      respond (req, res) {
        res.writeHead(202, {'x-expectsrv': 'testing'})
        res.write(JSON.stringify({ok: true}))
        res.end()
      }
    })
    http.get('http://localhost:8888')
        .then(res => {
          expect(res.statusCode).toEqual(202)
          expect(res.headers['x-expectsrv']).toEqual('testing')
          expect(res.body).toEqual({ok: true})
        })
        .then(done)
        .catch(done.fail)
  })

  it('will be removed by default', (done) => {
    server.expect({
      accept () { return true },
      respond () {
        return {ok: true}
      },
      repeat () { return false }
    })
    http.get('http://localhost:8888')
        .then(res => expect(res.body).toEqual({ok: true}))
        .then(() => http.get('http://localhost:8888'))
        .then(res => expect(res.statusCode).toEqual(404))
        .then(done)
        .catch(done.fail)
  })

  it('will be repeated if repeat returns true', (done) => {
    server.expect({
      accept () { return true },
      respond () {
        return {ok: true}
      },
      repeat () { return true }
    })
    http.get('http://localhost:8888')
        .then(res => expect(res.body).toEqual({ok: true}))
        .then(() => http.get('http://localhost:8888'))
        .then(res => expect(res.statusCode).toEqual(200))
        .then(done)
        .catch(done.fail)
  })

  it('will handle expectations in the order specified', (done) => {
    server.expect({
      accept () { return true },
      respond () { return {seq: 1} }
    })
    server.expect({
      accept () { return true },
      respond () { return {seq: 2} }
    })
    http.get('http://localhost:8888')
        .then(res => expect(res.body).toEqual({seq: 1}))
        .then(() => http.get('http://localhost:8888'))
        .then(res => expect(res.body).toEqual({seq: 2}))
        .then(done)
        .catch(done.fail)
  })

  it('will return 500 if there is an error in any of the handlers', (done) => {
    server.expect({
      accept () { throw new Error('err') }
    })
    http.get('http://localhost:8888')
        .then(res => expect(res.statusCode).toEqual(500))
        .then(done)
        .catch(done.fail)
  })

  it('can use any http method', (done) => {
    function setup (method) {
      server.expect({
        accept () { return true },
        respond () { return { method: method } }
      })
    }
    function request (method, body) {
      return http.request('http://localhost:8888', body, {method: method})
        .then(res => expect(res.body).toEqual({method: method}))
    }
    setup('GET')
    request('GET')
      .then(() => setup('POST'))
      .then(() => request('POST', {test: true}))
      .then(() => setup('DELETE'))
      .then(() => request('DELETE'))
      .then(done)
      .catch(done.fail)
  })
})
