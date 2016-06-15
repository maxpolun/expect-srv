Expect-srv
==========

A fake HTTP server for testing.

## Why?

Options:

1. Nock or similar: have similar benefit to Expect-srv, but work totally in-
process, making it unsuitable for end-to-end testing of isomorphic/universal
apps.

2. VCR clones (VCR.js, yakbak, etc): work with isomorphic apps, but some APIs
are hard to test repeatably when you aren't also in control of the server
(think things like registration), and especially they can be hard to use when
an API is under development.

expect-srv is for the other cases, where you want a real server (especially for universal/isomorphic javascript apps), but don't want to use a record/playback type test server, but rather specify the responses directly.

## Getting it

```sh
$ npm install --save-dev expect-srv
```

## Usage

```js
let ExpectSrv = require('expect-srv')
let server = new ExpectSrv({
  port: 8888
})

// shorthand
server.get('/path', {
  body: {
    json: true
  }
})

server.post('/path', {
  body: {
    json: true
  },
}, {
  body: {
    json: true
  },
  headers: {
    'Content-Type': 'xxx/yyy'
  }
})

// fully general API
server.expect({
  accept (request) {
    // check if the request should be handled by this expectation
    // this just returns true for the shorthands because they always are handled in order
    // no other callbacks are called if this returns false
  },
  valid (request) {
    // does the request match our expectation?
  }
  respond (request, response) {
    // send response if acceptable
    // tries to json-stringify return-values and send as response
    // or you can just write to http response object
  },
  repeat (request) {
    // do we keep accepting responses?
  }
})

server.listen()

// if any expectations are pending, throw an error.
// can be skipped if you set up routes that will always return
server.noPendingExpectations()
// checks that all exptations are valid
server.validate()

server.close()
```

## Example, using jasmine

```js
describe('echo', () => {
  let server
  beforeEach(() => {
    server = new ExpectSrv({port: 8888})
    server.post('/echo', {
      x: 1
    }, {
      x: 1
    })
    server.listen()
  })

  afterEach(() => {
    server.allExpectationsMatched()
    server.validate()
    server.close()
  })

  it('echos', (done) => {
    fetch('http://localhost:8888/echo', { method: 'POST', body: JSON.stringify({x: 1})})
      .then(res => res.json())
      .then(json => expect(json).toEqual({x: 1}))
      .then(done)
      .catch(done.fail)
  })
})
```
