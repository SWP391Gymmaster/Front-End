import assert from 'node:assert/strict'
import axios from 'axios'

const baseUrl = 'https://6724944e493fac3cf24eae5c.mockapi.io'
const packageUrl = `${baseUrl}/Package`
const marker = `member-crud-test-${Date.now()}`
let recordId
let deleted = false

async function getFetch(url) {
  const response = await fetch(url)
  return { response, data: response.status === 204 ? null : await response.json().catch(() => null) }
}

try {
  const created = await axios.post(packageUrl, {
    name: 'Temporary Member CRUD test',
    description: marker,
    price: 1,
    durationDays: 1,
    active: false,
    testMarker: marker,
  })
  assert.ok(created.status >= 200 && created.status < 300, 'POST creates a test record')
  recordId = String(created.data.id ?? '')

  if (!recordId) {
    const { response, data } = await getFetch(packageUrl)
    assert.equal(response.status, 200, 'GET collection returns the created test record')
    recordId = String(data.find((item) => item.testMarker === marker)?.id ?? '')
  }
  assert.ok(recordId, 'POST response or collection includes the created record id')

  const read = await getFetch(`${packageUrl}/${encodeURIComponent(recordId)}`)
  assert.equal(read.response.status, 200, 'GET by id reads the test record')
  assert.equal(read.data.testMarker, marker)

  const updated = await fetch(`${packageUrl}/${encodeURIComponent(recordId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...read.data, description: `${marker}-updated` }),
  })
  assert.ok(updated.ok, 'PUT updates the test record')

  const verified = await axios.get(`${packageUrl}/${encodeURIComponent(recordId)}`)
  assert.equal(verified.data.description, `${marker}-updated`)

  const removed = await fetch(`${packageUrl}/${encodeURIComponent(recordId)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  assert.ok(removed.ok, 'DELETE removes the test record')
  deleted = true

  const afterDelete = await axios.get(`${packageUrl}/${encodeURIComponent(recordId)}`)
    .then(() => null)
    .catch((error) => error.response?.status)
  assert.equal(afterDelete, 404, 'deleted test record is no longer available')
  console.log('PASS: Package CRUD via Axios and fetch; temporary test record deleted.')
} finally {
  if (recordId && !deleted) {
    await axios.delete(`${packageUrl}/${encodeURIComponent(recordId)}`).catch((error) => {
      console.error(`Cleanup failed for temporary MockAPI record ${recordId}: ${error.message}`)
    })
  }
}

for (const path of ['/Membership', '/Payment', '/Purchase']) {
  const result = await axios.get(`${baseUrl}${path}`)
    .then((response) => response.status)
    .catch((error) => error.response?.status ?? 'network error')
  console.log(`${path}: HTTP ${result}`)
}
