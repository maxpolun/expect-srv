'use strict'
let ExpectSrv = require('../../index')
let http = require('../support/http')

function post (url, body) {
  return http.request(url, body, {method: 'POST'})
}

describe('server.post', () => {
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

  it('adds a post expectation', (done) => {
    server.post('/path', {}, { body: { ok: true } })
    post('http://localhost:8888/path', {})
        .then(res => expect(res.body).toEqual({ok: true}))
        .then(done)
        .catch(done.fail)
  })

  it('is a oneshot expectation', (done) => {
    server.post('/path', {}, { body: { ok: true } })
    post('http://localhost:8888/path', {})
        .then(() => post('http://localhost:8888/path', {}))
        .then(res => expect(res.statusCode).toEqual(404))
        .then(done)
        .catch(done.fail)
  })

  it('can specify the response status', (done) => {
    server.post('/path', {}, { statusCode: 202, body: { ok: true } })
    post('http://localhost:8888/path', {})
        .then(res => expect(res.statusCode).toEqual(202))
        .then(done)
        .catch(done.fail)
  })

  it('can specify response headers', (done) => {
    server.post('/path', {}, {
      headers: {
        'x-my-header': 'test'
      }, body: {
        ok: true
      }
    })
    post('http://localhost:8888/path', {})
        .then(res => expect(res.headers['x-my-header']).toEqual('test'))
        .then(done)
        .catch(done.fail)
  })

  it('validates the path', (done) => {
    server.post('/path', {}, { body: { ok: true } })
    post('http://localhost:8888/different-path', {})
        .then(() => server.validate())
        .then(() => { throw new Error('expected to fail') },
              () => true)
        .then(done)
        .catch(done.fail)
  })

  it('validates the method', (done) => {
    server.post('/path', {}, { body: { ok: true } })
    http.get('http://localhost:8888/path')
        .then(() => server.validate())
        .then(() => { throw new Error('expected to fail') },
              () => true)
        .then(done)
        .catch(done.fail)
  })

  it('validates the body', (done) => {
    server.post('/path', { body: { ok: true } }, { body: { ok: true } })
    post('http://localhost:8888/path', { ok: true })
        .then(() => server.validate())
        .then(() => { throw new Error('expected to fail') },
              () => true)
        .then(done)
        .catch(done.fail)
  })
})
