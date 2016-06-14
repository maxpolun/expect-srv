let ExpectSrv = require('../../index')
let http = require('../support/http')

describe('server.get', () => {
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

  it('adds a get expectation', (done) => {
    server.get('/path', { body: { ok: true } })
    http.get('http://localhost:8888/path')
        .then(res => expect(res.body).toEqual({ok: true}))
        .then(done)
        .catch(done.fail)
  })

  it('is a oneshot expectation', (done) => {
    server.get('/path', { body: { ok: true } })
    http.get('http://localhost:8888/path')
        .then(() => http.get('http://localhost:8888/path'))
        .then(res => expect(res.statusCode).toEqual(404))
        .then(done)
        .catch(done.fail)
  })

  it('can specify the response status', (done) => {
    server.get('/path', { statusCode: 202, body: { ok: true } })
    http.get('http://localhost:8888/path')
        .then(res => expect(res.statusCode).toEqual(202))
        .then(done)
        .catch(done.fail)
  })

  it('can specify response headers', (done) => {
    server.get('/path', { headers: {
      'x-my-header': 'test'
    }, body: { ok: true } })
    http.get('http://localhost:8888/path')
        .then(res => expect(res.headers['x-my-header']).toEqual('test'))
        .then(done)
        .catch(done.fail)
  })

  it('validates the path', (done) => {
    server.get('/path', { body: { ok: true } })
    http.get('http://localhost:8888/different-path')
        .then(() => server.validate())
        .then(() => { throw new Error('expected to fail') },
              () => true)
        .then(done)
        .catch(done.fail)
  })

  it('validates the method', (done) => {
    server.get('/path', { body: { ok: true } })
    http.request('http://localhost:8888/path', {}, {method: 'POST'})
        .then(() => server.validate())
        .then(() => { throw new Error('expected to fail') },
              () => true)
        .then(done)
        .catch(done.fail)
  })
})
