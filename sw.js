/* eslint-env serviceworker */

importScripts('https://cdn.jsdelivr.net/npm/base64-js@1.3.1/base64js.min.js')

const PRECACHE = 'precache-v2'
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
  img_keys: [{
    img_keys: 'aW1hZ2VTY3I=l3j/tVWAZGVjb2RlQQSBS/vz2l3M4Eg++8aDQS3/++8ACzeDvkAVMqe/QWE'
  }, {
    img_keys: 'abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZz0123456789'
  }, {
    img_keys: '012.123.234.345.563.456.567.678.789'
  }]
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

  if (path.includes('.jbin')) path += '.txt'

  const canFetch = await fetch(path, { method: 'HEAD' }).then(e => e.status === 200)
  if (!canFetch) return fetch(req)

  return fetch(path)
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
  } else if (event.request.url.includes('.jbin') || event.request.url.includes('/hscene/')) {
    event.respondWith(CheckCDN(event.request))
  } else event.respondWith(fetch(event.request))
})
