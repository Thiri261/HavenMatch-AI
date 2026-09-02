/* global process */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const children = []

function start(label, script, args = []) {
  const child = spawn(process.execPath, [script, ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  children.push(child)
  child.on('exit', (code, signal) => {
    if (signal || code === 0) return
    console.error(`${label} stopped with exit code ${code}.`)
    stop(code)
  })
}

function stop(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exit(code)
}

process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())

start('Authentication API', join(root, 'server', 'index.js'))
start('Vite', join(root, 'node_modules', 'vite', 'bin', 'vite.js'))
