import { useState } from 'react'
import { announceAuthChange } from '../hooks/useSession'

const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/

export default function AuthPage({ mode }) {
  const isSignUp = mode === 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('user')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactLocation, setContactLocation] = useState('')
  const [message, setMessage] = useState(() => localStorage.getItem('havenmatch_auth_message') || '')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setMessage('Enter a valid email address.')
      return
    }
    if (isSignUp && !strongPassword.test(password)) {
      setMessage('Password must have at least 8 characters, including an uppercase letter, a number, and a special character.')
      return
    }
    if (!isSignUp && !password) {
      setMessage('Enter your password.')
      return
    }
    if (isSignUp && (!name.trim() || password !== confirmPassword)) {
      setMessage(!name.trim() ? 'Please enter your name.' : 'Passwords do not match.')
      return
    }
    if (isSignUp && role === 'business' && (!contactPhone.trim() || !contactEmail.trim() || !contactLocation.trim())) {
      setMessage('Vendors must add their contact phone, email, and location at signup so the admin can approve them.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/auth/${isSignUp ? 'signup' : 'login'}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password, role, phone: contactPhone.trim(), contactEmail: contactEmail.trim().toLowerCase(), location: contactLocation.trim() }),
      })
      const raw = await response.text()
      let data = null
      if (raw) {
        try { data = JSON.parse(raw) } catch { /* handled as an unavailable service below */ }
      }
      if (!response.ok) throw new Error(data?.message || 'The login service is unavailable. Please try again shortly.')
      if (!data?.user) throw new Error('The login service returned an invalid response. Please try again shortly.')
      if (isSignUp) {
        localStorage.setItem('havenmatch_auth_message', data.message || 'Account created. Log in to continue.')
        window.location.assign('#signin')
        return
      }
      if (data.user && (data.user.status === 'pending' || data.user.status === 'rejected')) {
        setMessage(data.user.status === 'pending'
          ? 'Your vendor account is awaiting admin approval. Please try again later.'
          : 'Your vendor account was not approved. Contact an administrator.')
        setSubmitting(false)
        return
      }
      localStorage.removeItem('havenmatch_auth_message')
      announceAuthChange(data.user)
      const redirect = localStorage.getItem('havenmatch_auth_redirect')
      localStorage.removeItem('havenmatch_auth_redirect')
      window.location.assign(redirect?.startsWith('#') ? redirect : data.user.role === 'admin' ? '#admin' : data.user.role === 'business' ? '#business' : '#dashboard')
    } catch (error) {
      setMessage(error instanceof TypeError ? 'Unable to connect to the login service. Please try again shortly.' : error.message)
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-layout">
        <div className="auth-card">
          <h2>{isSignUp ? 'Sign up' : 'Log in'}</h2>
          <p className="auth-intro">
            {isSignUp ? 'Save your preferences and matches.' : 'Welcome back'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <>
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
            </label>
            <fieldset className="auth-role">
              <legend>Account type</legend>
              <label><input type="radio" name="role" value="user" checked={role === 'user'} onChange={() => setRole('user')} /> Purchaser <span>Browse and match homes.</span></label>
              <label><input type="radio" name="role" value="business" checked={role === 'business'} onChange={() => setRole('business')} /> Vendor <span>Post housing listings for review.</span></label>
            </fieldset>
            {role === 'business' && (
              <fieldset className="auth-role auth-contact-fieldset">
                <legend>Your contact details (for admin approval)</legend>
                <label>Contact phone<input type="tel" placeholder="+95 9 123 456 789" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} required /></label>
                <label>Contact email<input type="email" placeholder="agent@example.com" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required /></label>
                <label>Office / meeting location<input placeholder="No. 5, Pyay Road, Yangon" value={contactLocation} onChange={(event) => setContactLocation(event.target.value)} required /></label>
              </fieldset>
            )}
            </>
          )}
          <label>
            Email address
            <input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </label>
          <label>
            Password
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 8 : 1} maxLength="128" required />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            {isSignUp && <small className="password-requirements">Use 8+ characters with an uppercase letter, number, and special character.</small>}
          </label>
          {!isSignUp && <button className="forgot-password" type="button" onClick={() => setMessage('Password reset will be available when the backend is connected.')}>Forgot password?</button>}
          {isSignUp && (
            <label>
              Confirm password
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength="8" maxLength="128" required />
            </label>
          )}
          {message && <p className="auth-error" role="alert">{message}</p>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Log in'}
          </button>
          </form>

          <p className="auth-switch">
            {isSignUp ? 'Already have an account?' : 'New to HavenMatch?'}{' '}
            <a href={isSignUp ? '#signin' : '#signup'}>{isSignUp ? 'Log in' : 'Create an account'}</a>
          </p>
        </div>
      </div>
    </section>
  )
}
