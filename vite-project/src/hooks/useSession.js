import { useEffect, useState } from 'react'

let cachedUser

export function announceAuthChange(user) {
  cachedUser = user
  window.dispatchEvent(new CustomEvent('havenmatch-auth-change', { detail: user }))
}

export default function useSession() {
  const [session, setSession] = useState(cachedUser)
  const [loading, setLoading] = useState(cachedUser === undefined)

  useEffect(() => {
    let active = true
    fetch('/api/auth/session', { credentials: 'include' }).then(async (response) => {
      if (!response.ok) return { user: null }
      const raw = await response.text()
      if (!raw) return { user: null }
      try { return JSON.parse(raw) } catch { return { user: null } }
    }).then(({ user }) => {
      if (!active) return
      cachedUser = user
      setSession(user)
      setLoading(false)
    }).catch(() => { if (active) setLoading(false) })
    const update = (event) => { setSession(event.detail); setLoading(false) }
    window.addEventListener('havenmatch-auth-change', update)
    return () => { active = false; window.removeEventListener('havenmatch-auth-change', update) }
  }, [])

  return { session, loading }
}
