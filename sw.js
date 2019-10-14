/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

const PRECACHE = "precache-v1";
const RUNTIME = "runtime";

const PRECACHE_URLS = [];

(function(r){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=r()}else if(typeof define==="function"&&define.amd){define([],r)}else{var e;if(typeof window!=="undefined"){e=window}else if(typeof global!=="undefined"){e=global}else if(typeof self!=="undefined"){e=self}else{e=this}e.base64js=r()}})(function(){var r,e,t;return function r(e,t,n){function o(i,a){if(!t[i]){if(!e[i]){var u=typeof require=="function"&&require;if(!a&&u)return u(i,!0);if(f)return f(i,!0);var d=new Error("Cannot find module '"+i+"'");throw d.code="MODULE_NOT_FOUND",d}var c=t[i]={exports:{}};e[i][0].call(c.exports,function(r){var t=e[i][1][r];return o(t?t:r)},c,c.exports,r,e,t,n)}return t[i].exports}var f=typeof require=="function"&&require;for(var i=0;i<n.length;i++)o(n[i]);return o}({"/":[function(r,e,t){"use strict";t.byteLength=c;t.toByteArray=v;t.fromByteArray=s;var n=[];var o=[];var f=typeof Uint8Array!=="undefined"?Uint8Array:Array;var i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";for(var a=0,u=i.length;a<u;++a){n[a]=i[a];o[i.charCodeAt(a)]=a}o["-".charCodeAt(0)]=62;o["_".charCodeAt(0)]=63;function d(r){var e=r.length;if(e%4>0){throw new Error("Invalid string. Length must be a multiple of 4")}return r[e-2]==="="?2:r[e-1]==="="?1:0}function c(r){return r.length*3/4-d(r)}function v(r){var e,t,n,i,a;var u=r.length;i=d(r);a=new f(u*3/4-i);t=i>0?u-4:u;var c=0;for(e=0;e<t;e+=4){n=o[r.charCodeAt(e)]<<18|o[r.charCodeAt(e+1)]<<12|o[r.charCodeAt(e+2)]<<6|o[r.charCodeAt(e+3)];a[c++]=n>>16&255;a[c++]=n>>8&255;a[c++]=n&255}if(i===2){n=o[r.charCodeAt(e)]<<2|o[r.charCodeAt(e+1)]>>4;a[c++]=n&255}else if(i===1){n=o[r.charCodeAt(e)]<<10|o[r.charCodeAt(e+1)]<<4|o[r.charCodeAt(e+2)]>>2;a[c++]=n>>8&255;a[c++]=n&255}return a}function l(r){return n[r>>18&63]+n[r>>12&63]+n[r>>6&63]+n[r&63]}function h(r,e,t){var n;var o=[];for(var f=e;f<t;f+=3){n=(r[f]<<16)+(r[f+1]<<8)+r[f+2];o.push(l(n))}return o.join("")}function s(r){var e;var t=r.length;var o=t%3;var f="";var i=[];var a=16383;for(var u=0,d=t-o;u<d;u+=a){i.push(h(r,u,u+a>d?d:u+a))}if(o===1){e=r[t-1];f+=n[e>>2];f+=n[e<<4&63];f+="=="}else if(o===2){e=(r[t-2]<<8)+r[t-1];f+=n[e>>10];f+=n[e>>4&63];f+=n[e<<2&63];f+="="}i.push(f);return i.join("")}},{}]},{},[])("/")});

const base64EncodingUTF8 = function(str) {
  var encoded = new TextEncoder().encode(str);
  return base64js.fromByteArray(encoded);
};

const base64DecodeUTF8 = function(str) {
  var str_array = base64js.toByteArray(str);
  return new TextDecoder().decode(str_array);
};

let api = null;

const initApi = async function() {
  api = await fetch("api").then(e => e.json());
};

const server_check = {
  opcode: 1301,
  error: 100,
  server_info: [{ IP: location.origin }],
  img_keys: "aW1hZ2VTY3I=l3j/tVWAZGVjb2RlQQSBS/vz2l3M4Eg++8aDQS3/++8ACzeDvkAVMqe/QWE"
};

self.addEventListener("install", event => {
  console.log("%c[SW] The service worker is installed.", "color:blue;background:yellow;");
  initApi();

  event.waitUntil(
    caches
      .open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  console.log("%c[SW] activated.", "color:blue;background:yellow;");
  initApi();

  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

const CONTENT_TYPE = "application/json; charset=utf-8";

const apiHandler = async function(req) {
  const rText = await req.text();
  const rObj = JSON.parse(base64DecodeUTF8(decodeURIComponent(rText)));

  let obj = api[rObj.opcode];
  if (obj == null) obj = { opcode: rObj.opcode, error: 210, sub_error: 0 };

  if ("server_time" in obj) obj.server_time = Math.round(Date.now() / 1000) + 9 * 60 * 60;

  return new Response(base64EncodingUTF8(JSON.stringify(obj)), {
    headers: { "content-type": CONTENT_TYPE, "cache-control": "no-store" }
  });
};

const CheckCDN = async function(req) {
  const urlObj = new URL(req.url);
  let path = urlObj.href.substr(urlObj.origin.length);
  if (path.indexOf(".jbin") != -1) path += ".txt";
  const canFetch = await fetch(path, { method: "HEAD" }).then(e => e.status == 200);
  return canFetch ? fetch(path) : fetch(req);
};

self.addEventListener("fetch", event => {
  if (event.request.url.startsWith(self.location.origin)) {
    const url = new URL(event.request.url);
    if (url.pathname == "/Server_Check.aspx") {
      event.respondWith(
        new Response(base64EncodingUTF8(JSON.stringify(server_check)), {
          headers: { "content-type": CONTENT_TYPE, "cache-control": "no-store" }
        })
      );
    } else if (url.pathname == "/Contact.aspx" || url.pathname == "/Announce.aspx")
      event.respondWith(apiHandler(event.request));
    else
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then(response => {
            if (event.request.method != "GET") return response;
            return caches.open(RUNTIME).then(cache => {
              // Put a copy of the response in the runtime cache.
              return cache.put(event.request, response.clone()).then(() => {
                return response;
              });
            });
          });
        })
      );
  } 
  else if (event.request.url.indexOf(".jbin") != -1 || event.request.url.indexOf("/hscene/") != -1)
    event.respondWith(CheckCDN(event.request));
  else event.respondWith(fetch(event.request));
});
