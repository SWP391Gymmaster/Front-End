import assert from 'node:assert/strict'
import { createUploadSignature, cloudinaryDevPlugin } from '../server/cloudinary.js'
import { validateAvatar, uploadAvatar } from '../src/services/avatarUpload.js'

const config = 'cloudinary://test-key:test-secret@test-cloud'
const signed = createUploadSignature(config)
assert.equal(signed.params.folder, 'gymmaster/avatars')
assert.equal(signed.signature.length, 64)
assert(!JSON.stringify(signed).includes('test-secret'))
assert.throws(() => createUploadSignature('https://example.com'))
assert.throws(() => validateAvatar({ type: 'image/svg+xml', size: 100 }))
assert.throws(() => validateAvatar({ type: 'image/jpeg', size: 0 }))
assert.throws(() => validateAvatar({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }))
validateAvatar({ type: 'image/webp', size: 5 * 1024 * 1024 })

function endpoint(url) {
  let handler
  cloudinaryDevPlugin(url).configureServer({ middlewares: { use(path, fn) { assert.equal(path, '/api/avatar/sign'); handler = fn } } })
  return (overrides = {}) => {
    const req = { method: 'POST', socket: { remoteAddress: '127.0.0.1' }, headers: { origin: 'http://localhost:5173', host: 'localhost:5173', 'x-gymmaster-upload': 'avatar' }, ...overrides }
    const res = { statusCode: 0, setHeader() {}, end(value) { this.body = JSON.parse(value) } }
    handler(req, res)
    return res
  }
}
const request = endpoint(config)
assert.equal(request({ method: 'GET' }).statusCode, 405)
assert.equal(request({ headers: { origin: 'https://example.com', host: 'localhost:5173' } }).statusCode, 403)
assert.equal(request({ socket: { remoteAddress: '192.168.1.10' } }).statusCode, 403)
assert.equal(request().statusCode, 200)
assert.equal(request().statusCode, 429)
assert.equal(endpoint(undefined)().statusCode, 503)

const originals = { fetch: globalThis.fetch, document: globalThis.document, createImageBitmap: globalThis.createImageBitmap }
try {
  let canvas
  let closed = false
  globalThis.createImageBitmap = async () => ({ width: 1024, height: 512, close() { closed = true } })
  globalThis.document = { createElement() { canvas = { getContext: () => ({ drawImage() {} }), toBlob: callback => callback(new Blob(['webp'], { type: 'image/webp' })) }; return canvas } }
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => calls.length === 1 ? signed : { secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/avatar.webp' } }
  }
  const file = new File(['image'], 'avatar.png', { type: 'image/png' })
  assert.equal(await uploadAvatar(file), 'https://res.cloudinary.com/test-cloud/image/upload/avatar.webp')
  assert.equal(canvas.width, 512)
  assert.equal(canvas.height, 256)
  assert(closed)
  assert.equal(calls[0].url, '/api/avatar/sign')
  assert.equal(calls[0].options.headers['X-GymMaster-Upload'], 'avatar')
  assert.equal(calls[1].options.body.get('signature'), signed.signature)
  assert.equal(calls[1].options.body.get('file').type, 'image/webp')
  assert.equal(calls[1].options.body.get('folder'), 'gymmaster/avatars')
  calls.length = 0
  await assert.rejects(uploadAvatar(file, AbortSignal.abort()))
  assert.equal(calls.length, 0)
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: 'Service unavailable' }) })
  await assert.rejects(uploadAvatar(file), /Service unavailable/)
  globalThis.createImageBitmap = async () => { throw new Error('Bad image') }
  await assert.rejects(uploadAvatar(file), /Không thể đọc ảnh/)
} finally {
  for (const [key, value] of Object.entries(originals)) {
    if (value === undefined) delete globalThis[key]
    else globalThis[key] = value
  }
}
console.log('PASS: image validation, resizing, signed upload request, abort and failures; signing endpoint configuration, origin restrictions, rate limit and secret isolation. No external uploads performed.')
