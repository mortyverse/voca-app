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

  const getTitle = () => {
    switch (currentApp) {
      case 'countable': return '가산/불가산 명사';
      case 'person-object': return '사람 vs 사물/추상';
      case 'five-step': return '단어 암기 (5단계)';
      case 'wordbook': return '나만의 단어장';
      default: return 'VocaNote';
    }
  }

  return (
    <ErrorBoundary>
      <div className={`app-layout ${isMaximized ? 'maximized' : ''}`}>

        {/* Sidebar Navigation */}
        {!isMaximized && (
          <aside className="sidebar">
            <div className="sidebar-header">
              <h1>VocaNote</h1>
              <p className="sidebar-subtitle">Daily Learning</p>
            </div>

            <nav className="sidebar-nav">
              <button
                onClick={() => setCurrentApp('countable')}
                className={`nav-item ${currentApp === 'countable' ? 'active' : ''}`}
              >
                <span className="icon">📚</span> 가산/불가산 명사
              </button>
              <button
                onClick={() => setCurrentApp('person-object')}
                className={`nav-item ${currentApp === 'person-object' ? 'active' : ''}`}
              >
                <span className="icon">👤</span> 사람 vs 사물
              </button>
              <button
                onClick={() => setCurrentApp('five-step')}
                className={`nav-item ${currentApp === 'five-step' ? 'active' : ''}`}
              >
                <span className="icon">📝</span> 5단계 암기
              </button>
              <button
                onClick={() => setCurrentApp('wordbook')}
                className={`nav-item ${currentApp === 'wordbook' ? 'active' : ''}`}
              >
                <span className="icon">📖</span> 나만의 단어장
              </button>
            </nav>

            <div className="sidebar-footer">
              <p className="handwritten-note">Today is a good day to learn!</p>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="main-content">
          <header className="app-header">
            <div className="header-title">
              <h2>{getTitle()}</h2>
            </div>
            <div className="header-actions">
              <button
                className="btn-icon"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "사이드바 보이기" : "집중 모드 (사이드바 숨기기)"}
              >
                {isMaximized ? '◫' : '⤢'}
              </button>
            </div>
          </header>

          <div className="dashboard-area">
            <div className="paper-sheet">
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
        </main>

      </div>
    </ErrorBoundary>
  )
}
