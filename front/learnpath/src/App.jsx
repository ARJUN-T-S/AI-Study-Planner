import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'


function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      {/* Logos */}
      <div className="flex gap-8 mb-6">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="h-16 hover:scale-110 transition-transform" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="h-16 hover:scale-110 transition-transform" alt="React logo" />
        </a>
      </div>

      {/* Heading */}
      <h1 className="text-4xl font-extrabold mb-4">Vite + React + Tailwind 🚀</h1>

      {/* Card */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow-lg text-center">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-lg font-medium transition"
        >
          Count is {count}
        </button>
        <p className="mt-4 text-gray-300">
          Edit <code className="bg-gray-700 px-1 rounded">src/App.jsx</code> and save to test HMR
        </p>
      </div>

      {/* Footer */}
      <p className="mt-6 text-gray-400">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
