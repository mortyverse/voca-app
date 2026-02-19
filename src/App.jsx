import { useState, Component } from 'react'
import CountableApp from './components/CountableApp'
import PersonObjectApp from './components/PersonObjectApp'
import FiveStepStudyApp from './components/FiveStepStudyApp'
import MyWordbook from './components/MyWordbook'
import './App.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#333' }}>
          <h2>문제가 발생했습니다.</h2>
          <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{this.state.error && this.state.error.toString()}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>새로고침</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [currentApp, setCurrentApp] = useState('countable')
  const [isMaximized, setIsMaximized] = useState(false)
  const [fiveStepInitialWords, setFiveStepInitialWords] = useState(null)

  const handleStartFiveStep = (words) => {
    setFiveStepInitialWords(words)
    setCurrentApp('five-step')
  }

  return (
    <ErrorBoundary>
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
          {currentApp === 'five-step' && (
            <FiveStepStudyApp
              isMaximized={isMaximized}
              initialWords={fiveStepInitialWords}
              onClearInitialWords={() => setFiveStepInitialWords(null)}
            />
          )}
          {currentApp === 'wordbook' && (
            <MyWordbook
              isMaximized={isMaximized}
              onStartFiveStep={handleStartFiveStep}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
