import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = join(fileURLToPath(new URL('.', import.meta.url)), '..')

function read(relativePath) {
  return readFileSync(join(rootDir, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const compose = read('docker-compose.yml')
const nginx = read('nginx.conf')
const dockerfile = read('Dockerfile')

const composeLines = compose.split(/\r?\n/)
const composeServiceNames = []
const composeServiceBlocks = new Map()
let inServicesBlock = false
let currentServiceName = null

for (const line of composeLines) {
  if (/^services:\s*$/.test(line)) {
    inServicesBlock = true
    currentServiceName = null
    continue
  }

  if (inServicesBlock && /^\S/.test(line)) {
    inServicesBlock = false
    currentServiceName = null
  }

  if (!inServicesBlock) {
    continue
  }

  const serviceMatch = line.match(/^  ([a-zA-Z0-9_-]+):\s*$/)
  if (serviceMatch) {
    currentServiceName = serviceMatch[1]
    composeServiceNames.push(currentServiceName)
    composeServiceBlocks.set(currentServiceName, [])
    continue
  }

  if (currentServiceName && (/^    /.test(line) || line.trim() === '')) {
    composeServiceBlocks.get(currentServiceName).push(line)
  }
}

assert(composeServiceNames.length > 0, 'Expected docker-compose.yml to define at least one service.')

assert(
  composeServiceNames.length === 1,
  `Expected exactly one Compose service for single-image deployment, found ${composeServiceNames.length}: ${composeServiceNames.join(', ')}`,
)

const primaryServiceName = composeServiceNames[0]
const primaryServiceBlock = composeServiceBlocks.get(primaryServiceName)?.join('\n') ?? ''
assert(primaryServiceBlock, `Expected to find a Compose block for ${primaryServiceName}.`)

assert(
  !compose.includes('tts-api:'),
  'Expected docker-compose.yml to stop declaring a separate tts-api service.',
)
assert(
  /^\s{4}image:\s+/m.test(primaryServiceBlock),
  'Expected the single Compose service to deploy a prebuilt Docker Hub image via image:.',
)
assert(
  !/^\s{4}build:\s+/m.test(primaryServiceBlock),
  'Expected the single Compose service to stop building locally and use a published image instead.',
)
assert(
  /proxy_pass\s+http:\/\/127\.0\.0\.1:3001;/.test(nginx),
  'Expected nginx.conf to proxy /api/ traffic to the local bundled tts-api on 127.0.0.1:3001.',
)
assert(
  dockerfile.includes('COPY --from=tts-build'),
  'Expected Dockerfile to copy the built tts-service artifacts into the final runtime image.',
)
assert(
  dockerfile.includes('entrypoint.sh'),
  'Expected Dockerfile to install an entrypoint script for the multi-process runtime.',
)
assert(
  /CMD\s+\["\/app\/entrypoint\.sh"\]/.test(dockerfile) || /ENTRYPOINT\s+\["\/app\/entrypoint\.sh"\]/.test(dockerfile),
  'Expected Dockerfile to launch the bundled runtime through /app/entrypoint.sh.',
)

console.log('Single-image deployment checks passed.')
