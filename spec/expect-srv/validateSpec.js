let ExpectSrv = require('../../index')
let http = require('../support/http')

describe('server.validate', () => {
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

  it('does nothing when all expectations are valid', (done) => {
    server.expect({
      accept () { return true },
      respond () { return { ok: true } },
      valid () { return true }
    })
    http.get('http://localhost:8888')
        .then(() => server.validate())
        .then(done)
        .catch(done.fail)
  })

  it('throws when an expectation is invalid', (done) => {
    server.expect({
      accept () { return true },
      respond () { return { ok: true } },
      valid () { return false }
    })
    http.get('http://localhost:8888')
        .then(() => server.validate())
        .then(() => { throw new Error('expected validate to fail') }, () => true)
        .then(done)
        .catch(done.fail)
  })
})

describe('server.allExpectationsMatched', () => {
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

  it('does nothing if there are no pending expectations', (done) => {
    server.expect({
      accept () { return true },
      respond () { return {} }
    })
    http.get('http://localhost:8888')
        .then(() => server.allExpectationsMatched())
        .then(done)
        .catch(done.fail)
  })

  it('throws if there are pending expectations', (done) => {
    server.expect({
      accept () { return true },
      respond () { return {} },
      repeat () { return true }
    })
    http.get('http://localhost:8888')
        .then(() => server.allExpectationsMatched())
        .then(() => { throw new Error('expected to fail') },
              () => true)
        .then(done)
        .catch(done.fail)
  })
})
