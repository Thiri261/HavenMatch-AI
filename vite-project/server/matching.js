/* global process */

import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { calculateMatch, enrichMatch, isPropertyEligibleForIntent, normalizeRequest, validateMatchRequest } from './matching-core.js'

const serverDirectory = dirname(fileURLToPath(import.meta.url))
const propertiesPath = join(serverDirectory, 'data', 'properties.json')
const prologPath = join(serverDirectory, 'prolog', 'engine.pl')

export { calculateMatch, enrichMatch, isPropertyEligibleForIntent, MatchValidationError, normalizeRequest, validateMatchRequest } from './matching-core.js'

export async function getProperties() {
  return JSON.parse(await readFile(propertiesPath, 'utf8'))
}

export function runProlog(request, properties) {
  return new Promise((resolve, reject) => {
    const executable = process.env.SWIPL_PATH || (process.platform === 'win32' ? 'swipl.exe' : 'swipl')
    const child = spawn(executable, ['-q', '-s', prologPath], { stdio: ['pipe', 'pipe', 'pipe'] })
    let output = ''
    let errorOutput = ''
    child.stdout.on('data', (chunk) => { output += chunk.toString() })
    child.stderr.on('data', (chunk) => { errorOutput += chunk.toString() })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(errorOutput || `Prolog exited with code ${code}`))
      try { resolve(JSON.parse(output)) } catch { reject(new Error(`Prolog returned invalid JSON${errorOutput ? `: ${errorOutput}` : '.'}`)) }
    })
    child.stdin.end(`${JSON.stringify({ request, properties })}\n`)
  })
}

export async function matchProperties(input) {
  const request = validateMatchRequest(input, normalizeRequest(input))
  const properties = (await getProperties()).filter((property) => isPropertyEligibleForIntent(property, request.intent))

  try {
    const prologResult = await runProlog(request, properties)
    const matches = (prologResult.matches || [])
      .map((match) => enrichMatch(match, request))
      .sort((a, b) => b.score - a.score || a.priceMmk - b.priceMmk)
      .slice(0, 20)
    return { engine: 'prolog', request, matches, candidateCount: properties.length }
  } catch (error) {
    console.error(`[HavenMatch] Prolog unavailable; using Node fallback: ${error.message}`)
  }

  const matches = properties
    .map((property) => ({ property, ...calculateMatch(property, request) }))
    .filter((result) => result.failedRequirements.length === 0)
    .sort((a, b) => b.score - a.score || a.property.priceMmk - b.property.priceMmk)
    .slice(0, 20)
    .map(({ property, ...match }) => enrichMatch({ ...property, ...match }, request))
  return { engine: 'node-fallback', request, matches, candidateCount: properties.length }
}
