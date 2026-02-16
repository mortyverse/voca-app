import { useState, useEffect } from 'react'
import '../App.css' // Recycle existing styles

export default function MyWordbook({ isMaximized }) {
    // Data structure: { id, name, words: [{ id, eng, kor, date }] }
    const [folders, setFolders] = useState([])
    const [activeFolderId, setActiveFolderId] = useState(null)
    const [newFolderName, setNewFolderName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('myWordbook')
        if (saved) {
            setFolders(JSON.parse(saved))
        } else {
            // Default folder
            const initial = [{ id: 'default', name: '기본 단어장', words: [] }]
            setFolders(initial)
            localStorage.setItem('myWordbook', JSON.stringify(initial))
        }
    }, [])

    // Save to localStorage whenever folders change
    useEffect(() => {
        if (folders.length > 0) {
            localStorage.setItem('myWordbook', JSON.stringify(folders))
        }
    }, [folders])

    const createFolder = () => {
        if (!newFolderName.trim()) return
        const newFolder = {
            id: Date.now().toString(),
            name: newFolderName,
            words: []
        }
        setFolders([...folders, newFolder])
        setNewFolderName('')
        setIsCreating(false)
    }

    const deleteFolder = (id) => {
        if (window.confirm('정말 이 단어장을 삭제하시겠습니까?')) {
            setFolders(folders.filter(f => f.id !== id))
            if (activeFolderId === id) setActiveFolderId(null)
        }
    }

    const deleteWord = (folderId, wordId) => {
        setFolders(folders.map(f => {
            if (f.id === folderId) {
                return { ...f, words: f.words.filter(w => w.id !== wordId) }
            }
            return f
        }))
    }

    const activeFolder = folders.find(f => f.id === activeFolderId)

    // Test Mode State
    const [testMode, setTestMode] = useState('none') // 'none', 'testing', 'result'
    const [testWords, setTestWords] = useState([])
    const [userAnswers, setUserAnswers] = useState({})
    const [testResult, setTestResult] = useState(null)

    // Reset test state when changing folders
    useEffect(() => {
        setTestMode('none')
        setTestWords([])
        setUserAnswers({})
        setTestResult(null)
    }, [activeFolderId])

    const startTest = () => {
        if (!activeFolder || activeFolder.words.length === 0) return
        // Shuffle words
        const shuffled = [...activeFolder.words].sort(() => Math.random() - 0.5)
        setTestWords(shuffled)
        setUserAnswers({})
        setTestMode('testing')
    }

    const handleAnswerChange = (wordId, value) => {
        setUserAnswers(prev => ({ ...prev, [wordId]: value }))
    }

    const submitTest = () => {
        if (!window.confirm('채점하시겠습니까?')) return

        let correctCount = 0
        const gradedResults = testWords.map(word => {
            const input = userAnswers[word.id] || ''
            // Normalize: remove all whitespace for comparison
            const normalizedInput = input.replace(/\s+/g, '')
            const normalizedAnswer = word.kor.replace(/\s+/g, '')

            const isCorrect = normalizedInput === normalizedAnswer // Simple exact match after whitespace stripping
            if (isCorrect) correctCount++

            return {
                ...word,
                input,
                isCorrect
            }
        })

        setTestResult({
            correctCount,
            totalCount: testWords.length,
            gradedResults,
            score: Math.round((correctCount / testWords.length) * 100)
        })
        setTestMode('result')
    }

    return (
        <div className="container">
            {!isMaximized && (
                <header className="header">
                    <h1>나만의 단어장</h1>
                    <p className="subtitle">저장한 단어를 복습하고 관리하세요.</p>
                </header>
            )}

            {!activeFolderId ? (
                // Folder List View
                <div className="folder-list-view">
                    <div className="actions-row">
                        <h2 style={{ margin: 0 }}>단어장 목록</h2>
                        <button
                            className="btn-primary"
                            onClick={() => setIsCreating(true)}
                            disabled={isCreating}
                        >
                            + 새 단어장
                        </button>
                    </div>

                    {isCreating && (
                        <div className="card create-folder-form">
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="단어장 이름"
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && createFolder()}
                                />
                                <button className="btn-primary" onClick={createFolder}>확인</button>
                                <button className="btn-secondary" onClick={() => setIsCreating(false)}>취소</button>
                            </div>
                        </div>
                    )}

                    <div className="folder-grid">
                        {folders.map(folder => (
                            <div key={folder.id} className="card folder-card" onClick={() => setActiveFolderId(folder.id)}>
                                <div className="folder-icon">📁</div>
                                <h3>{folder.name}</h3>
                                <p>{folder.words.length}개의 단어</p>
                                <button
                                    className="btn-delete-folder"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteFolder(folder.id)
                                    }}
                                >
                                    삭제
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Word List View
                // Word List View or Test View
                <div className="word-list-view">
                    <div className="actions-row" style={{ marginBottom: '1rem' }}>
                        <button className="btn-secondary" onClick={() => setActiveFolderId(null)}>← 목록으로</button>
                        <h2>{activeFolder.name}</h2>
                        {testMode === 'none' && activeFolder.words.length > 0 && (
                            <button className="btn-primary" onClick={startTest}>
                                📝 테스트 시작
                            </button>
                        )}
                    </div>

                    {testMode === 'none' && (
                        <div className="card">
                            {activeFolder.words.length === 0 ? (
                                <p className="empty-state">저장된 단어가 없습니다.</p>
                            ) : (
                                <ul className="word-list">
                                    {activeFolder.words.map(word => (
                                        <li key={word.id} className="word-item">
                                            <div className="word-text">
                                                <span className="eng" style={{ fontWeight: 'bold', marginRight: '10px' }}>{word.eng}</span>
                                                <span className="kor" style={{ color: '#64748b' }}>{word.kor}</span>
                                            </div>
                                            <button
                                                className="btn-delete"
                                                onClick={() => deleteWord(activeFolder.id, word.id)}
                                            >
                                                🗑️
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {testMode === 'testing' && (
                        <div className="card test-container">
                            <h3>단어 테스트</h3>
                            <p className="subtitle">한글 뜻을 입력하세요.</p>
                            <div className="test-list">
                                {testWords.map((word, index) => (
                                    <div key={word.id} className="test-item" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="test-eng" style={{ flex: 1, fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {index + 1}. {word.eng}
                                        </div>
                                        <input
                                            type="text"
                                            className="input-field"
                                            style={{ flex: 2 }}
                                            placeholder="뜻 입력"
                                            value={userAnswers[word.id] || ''}
                                            onChange={(e) => handleAnswerChange(word.id, e.target.value)}
                                            autoComplete="off"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="test-actions" style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <button className="btn-primary" onClick={submitTest} style={{ fontSize: '1.2rem', padding: '0.8rem 2rem' }}>
                                    채점하기
                                </button>
                                <button className="btn-secondary" onClick={() => setTestMode('none')} style={{ marginLeft: '1rem' }}>
                                    취소
                                </button>
                            </div>
                        </div>
                    )}

                    {testMode === 'result' && testResult && (
                        <div className="card result-container">
                            <div className="result-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <h3>테스트 결과</h3>
                                <div className="score-circle" style={{
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    color: testResult.score >= 80 ? '#22c55e' : testResult.score >= 50 ? '#f59e0b' : '#ef4444',
                                    margin: '1rem 0'
                                }}>
                                    {testResult.score}%
                                </div>
                                <p>{testResult.totalCount}개 중 {testResult.correctCount}개 정답</p>
                            </div>

                            <ul className="result-list" style={{ listStyle: 'none', padding: 0 }}>
                                {testResult.gradedResults.map((item, index) => (
                                    <li key={item.id} className="result-item" style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid #eee',
                                        backgroundColor: item.isCorrect ? '#f0fdf4' : '#fef2f2',
                                        marginBottom: '0.5rem',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold' }}>{item.eng}</span>
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: item.isCorrect ? '#22c55e' : '#ef4444'
                                            }}>
                                                {item.isCorrect ? '정답' : '오답'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                                            <div>
                                                <span style={{ color: '#64748b' }}>제출 답안:</span>
                                                <div style={{ color: item.isCorrect ? '#1e293b' : '#ef4444' }}>
                                                    {item.input || '(공백)'}
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ color: '#64748b' }}>정답:</span>
                                                <div style={{ color: '#22c55e' }}>{item.kor}</div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="result-actions" style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <button className="btn-primary" onClick={startTest}>
                                    다시 테스트하기
                                </button>
                                <button className="btn-secondary" onClick={() => setTestMode('none')} style={{ marginLeft: '1rem' }}>
                                    목록으로
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
