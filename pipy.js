pipy({
    _BATCH_SIZE: 1000,
    _BATCH_TIMEOUT: 5000,
    _CONTENT_TYPES: {
        '': true,
        'text/plain': true,
        'text/html': true,
        'application/json': true,
        'application/xml': true,
        'multipart/form-data': true,
    },

    _g: {
        buffer: new Data,
        bufferSize: 0,
        bufferTime: 0,
    },

    _queue: null,
    _contentType: '',
    _startTime: 0,
    _responseTime: 0,
})

.listen(8500)
    .onSessionStart(() => _queue = [])
    .fork('in')
    .connect('consul-agent:9510')
    .fork('out')

// Extract request info
.pipeline('in')
.decodeHttpRequest()
.onMessageStart(e => (
    _startTime = Date.now(),
    _contentType = e.head.headers['content-type'] || '',
    _contentType = _contentType.split(';')[0]
))
.onMessage(msg => _queue.push({
    startTime: _startTime,
    ...msg.head,
    body: _CONTENT_TYPES[_contentType] ? msg.body.toString() : null,
}))

// Extract response info
.pipeline('out')
.decodeHttpResponse()
.onMessageStart(e => (
    _responseTime = Date.now(),
    _contentType = e.head.headers['content-type'] || '',
    _contentType = _contentType.split(';')[0]
))
.replaceMessage(msg => new Message(
    JSON.encode({
        ..._queue.shift(),
        latency: _responseTime - _startTime,
        endTime: Date.now(),
        response: {
            ...msg.head,
            body: _CONTENT_TYPES[_contentType] ? msg.body.toString() : null,
        },
    }).push(',')
))
.link('batch')

// Accumulate log messages into batches
.pipeline('batch')
.replaceMessage(msg => (
    msg.body.size > 0 && (
        _g.buffer.push(msg.body),
        _g.bufferSize++
    ),
    (_g.bufferSize >= _BATCH_SIZE ||
    (_g.bufferSize > 0 && Date.now() - _g.bufferTime > _BATCH_TIMEOUT)) ? (
        new Message(_g.buffer)
    ) : (
        null
    )
))
.onMessageStart(() => (
    _g.buffer = new Data,
    _g.bufferSize = 0,
    _g.bufferTime = Date.now()
))
.mux('mux')

// Shared logging session
.pipeline('mux')
  .encodeHttpRequest({
    method: 'POST',
    path: '/?query=insert%20into%20log(message)%20format%20JSONAsString',
    //headers: {Authorization: 'Basic ZGVmYXVsdDpmbG9tZXNo'}
  })
  .connect('10.0.0.60:8123')
  .decodeHttpResponse()

// Regularly flush the logging session
.task('1s')
  .fork('batch')
  .replaceMessage(() => new SessionEnd)
