import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState<string>('Loading...')

  useEffect(() => {
    fetch('http://localhost:5000/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Failed to reach backend'))
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem', fontFamily: 'sans-serif' }}>
      <h1>Hello World</h1>
      <p>Backend says: <strong>{message}</strong></p>
    </div>
  )
}

export default App
