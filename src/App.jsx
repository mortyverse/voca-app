import { useState } from 'react'
import CountableApp from './components/CountableApp'
import PersonObjectApp from './components/PersonObjectApp'
import FiveStepStudyApp from './components/FiveStepStudyApp'
import MyWordbook from './components/MyWordbook'
import './App.css'

export default function App() {
  const [currentApp, setCurrentApp] = useState('countable')
  const [isMaximized, setIsMaximized] = useState(false)

  return (
    <div className={`main-wrapper ${isMaximized ? 'maximized' : ''}`}>
      {!isMaximized && (
        <nav className="main-nav">
          <button
            onClick={() => setCurrentApp('countable')}
            className={`nav-btn ${currentApp === 'countable' ? 'active' : ''}`}
          >
            가산/불가산 명사
          </button>
          <button
            onClick={() => setCurrentApp('person-object')}
            className={`nav-btn ${currentApp === 'person-object' ? 'active' : ''}`}
          >
            사람 vs 사물/추상
          </button>
          <button
            onClick={() => setCurrentApp('five-step')}
            className={`nav-btn ${currentApp === 'five-step' ? 'active' : ''}`}
          >
            단어 암기 (5단계)
          </button>
          <button
            onClick={() => setCurrentApp('wordbook')}
            className={`nav-btn ${currentApp === 'wordbook' ? 'active' : ''}`}
          >
            나만의 단어장
          </button>
        </nav>
      )}

      <div className="app-content" style={{ position: 'relative', height: isMaximized ? '100vh' : 'auto' }}>
        <button
          className="btn-maximize"
          onClick={() => setIsMaximized(!isMaximized)}
          title={isMaximized ? "화면 축소" : "화면 확대 (집중 모드)"}
        >
          {isMaximized ? '⤢ 축소' : '⤢ 확대'}
        </button>

        {currentApp === 'countable' && <CountableApp isMaximized={isMaximized} />}
        {currentApp === 'person-object' && <PersonObjectApp isMaximized={isMaximized} />}
        {currentApp === 'five-step' && <FiveStepStudyApp isMaximized={isMaximized} />}
        {currentApp === 'wordbook' && <MyWordbook isMaximized={isMaximized} />}
      </div>
    </div>
  )
}
