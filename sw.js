/* eslint-env serviceworker */

importScripts('https://cdn.jsdelivr.net/npm/base64-js@1.3.1/base64js.min.js')

const PRECACHE = 'precache-v1'
const RUNTIME = 'runtime'

const PRECACHE_URLS = []

const base64EncodingUTF8 = function (str) {
  var encoded = new TextEncoder().encode(str)
  return base64js.fromByteArray(encoded)
}

const base64DecodeUTF8 = function (str) {
  var strArray = base64js.toByteArray(str)
  return new TextDecoder().decode(strArray)
}

let api = null

const initApi = async function () {
  if (!api) api = await fetch('api').then(e => e.json())
  return api
}

const serverCheck = {
  opcode: 1301,
  error: 100,
  server_info: [{ IP: location.origin }],
  img_keys: 'aW1hZ2VTY3I=l3j/tVWAZGVjb2RlQQSBS/vz2l3M4Eg++8aDQS3/++8ACzeDvkAVMqe/QWE'
}

self.addEventListener('install', event => {
  console.log('%c[SW] The service worker is installed.', 'color:blue;background:yellow;')
  initApi()

  event.waitUntil(
    caches
      .open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  console.log('%c[SW] activated.', 'color:blue;background:yellow;')
  initApi()

  const currentCaches = [PRECACHE, RUNTIME]
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete)
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

const CONTENT_TYPE = 'application/json; charset=utf-8'

const apiHandler = async function (req) {
  const rText = await req.text()
  const rObj = JSON.parse(base64DecodeUTF8(decodeURIComponent(rText)))

  let obj = api && api[rObj.opcode] || await initApi()[rObj.opcode]
  if (obj == null) obj = { opcode: rObj.opcode, error: 210, sub_error: 0 }

  if ('server_time' in obj) obj.server_time = Math.round(Date.now() / 1000) + 9 * 60 * 60

  return new Response(base64EncodingUTF8(JSON.stringify(obj)), {
    headers: { 'content-type': CONTENT_TYPE, 'cache-control': 'no-store' }
  })
}

const CheckCDN = async function (req) {
  const urlObj = new URL(req.url)
  let path = urlObj.href.substr(urlObj.origin.length)

  if (path.indexOf('.jbin') !== -1) path += '.txt'

  const canFetch = await fetch(path, { method: 'HEAD' }).then(e => e.status === 200)
  if (!canFetch) return fetch(req)

  if (path.indexOf('.png') !== -1) {
    let orgRsp
    return fetch(path).then((e) => {
      orgRsp = e
      return e.body
    }).then((b) => b.pipeThrough(new PNGTransformStream()))
      .then((e) => new Response(e, orgRsp))
  }

  return fetch(path)
}

class PNGTransformStream {
  constructor () {
    const decrypter = {
      tempBuf: new Uint8Array(0),
      onChunk: null,
      onClose: null,
      addBinaryData (u) {
        if (!(u instanceof Uint8Array)) this.onChunk(u)
        else {
          if (u.length < 512 && this.tempBuf.length + u.length < 512) {
            const newData = new Uint8Array(this.tempBuf.length + u.length)
            newData.set(this.tempBuf, 0)
            newData.set(u, this.tempBuf.length)
            this.tempBuf = newData
          } else {
            if (this.tempBuf.length !== 0) {
              const newData = new Uint8Array(this.tempBuf.length + u.length)
              newData.set(this.tempBuf, 0)
              newData.set(u, this.tempBuf.length)
              u = newData
            }

            const less = u.length % 512
            const buf = u.slice(0, u.length - less)

            const lessD = u.buffer.slice(buf.length, u.length)
            this.tempBuf = new Uint8Array(lessD)

            for (let start = 0; start < buf.length; start += 512) {
              for (let index = 0; index < 99; index += 3) {
                const offset = start + index
                const o1 = buf[offset] ^ 114
                const o2 = buf[offset + 1] ^ o1 ^ 114
                const o3 = buf[offset + 2] ^ o2

                buf[offset] = o1
                buf[offset + 1] = o2
                buf[offset + 2] = o3
              }
            }

            this.onChunk(buf)
          }
        }
      }
    }

    this.readable = new ReadableStream({
      start (controller) {
        decrypter.onChunk = chunk => controller.enqueue(chunk)
        decrypter.onClose = () => controller.close()
      }
    })

    this.writable = new WritableStream({
      write (uint8Array) {
        decrypter.addBinaryData(uint8Array)
      },
      close: () => decrypter.onClose()
    })
  }
}

self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.location.origin)) {
    const url = new URL(event.request.url)
    if (url.pathname === '/Server_Check.aspx') {
      event.respondWith(
        new Response(base64EncodingUTF8(JSON.stringify(serverCheck)), {
          headers: { 'content-type': CONTENT_TYPE, 'cache-control': 'no-store' }
        })
      )
    } else if (url.pathname === '/Contact.aspx' || url.pathname === '/Announce.aspx') {
      event.respondWith(apiHandler(event.request))
    } else {
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse

          return fetch(event.request).then(response => {
            if (event.request.method !== 'GET') return response
            return caches.open(RUNTIME).then(cache => {
              // Put a copy of the response in the runtime cache.
              return cache.put(event.request, response.clone()).then(() => {
                return response
              })
            })
          })
        })
      )
    }
  } else if (event.request.url.indexOf('.jbin') !== -1 || event.request.url.indexOf('/hscene/') !== -1) {
    event.respondWith(CheckCDN(event.request))
  // } else if (event.request.url.indexOf('/hscene/') !== -1) {
  //   event.respondWith(CheckCDNLocal(event.request))
  } else event.respondWith(fetch(event.request))
})
