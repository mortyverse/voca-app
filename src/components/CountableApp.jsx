import { useState, useEffect } from 'react'

export default function CountableApp({ isMaximized }) {
    const [words, setWords] = useState([])
    const [view, setView] = useState('add') // 'add', 'practice', 'test'

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Check for old localStorage data to migrate
                const saved = localStorage.getItem('voca-words')
                if (saved) {
                    const localWords = JSON.parse(saved)
                    if (Array.isArray(localWords) && localWords.length > 0) {
                        for (const word of localWords) {
                            await fetch('http://localhost:3000/words', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    // ensure no ID collision with server generated ones, or just let server generate
                                    word: word.word,
                                    type: word.type
                                })
                            })
                        }
                    }
                    // Clear migrated data
                    localStorage.removeItem('voca-words')
                }

                // 2. Fetch data from server
                const response = await fetch('http://localhost:3000/words')
                const data = await response.json()
                setWords(data)
            } catch (error) {
                console.error('Failed to fetch words:', error)
            }
        }
        fetchData()
    }, [])

    const addWord = async (word, type) => {
        if (!word.trim()) return

        try {
            const newWord = { word: word.trim(), type }
            const response = await fetch('http://localhost:3000/words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newWord)
            })
            const savedWord = await response.json()
            setWords([...words, savedWord])
        } catch (error) {
            console.error('Failed to add word:', error)
        }
    }

    const deleteWord = async (id) => {
        try {
            await fetch(`http://localhost:3000/words/${id}`, {
                method: 'DELETE'
            })
            setWords(words.filter(w => w.id !== id))
        } catch (error) {
            console.error('Failed to delete word:', error)
        }
    }

    return (
        <div className="container">
            {!isMaximized && (
                <header className="header">
                    <h1>가산명사? 불가산명사?</h1>
                    <p className="subtitle">단어를 저장하고 가산/불가산 여부를 테스트해보세요.</p>
                </header>
            )}

            <nav className="tabs">
                <button
                    className={`tab-btn ${view === 'add' ? 'active' : ''}`}
                    onClick={() => setView('add')}
                >
                    단어장 관리
                </button>
                <button
                    className={`tab-btn ${view === 'practice' ? 'active' : ''}`}
                    onClick={() => setView('practice')}
                >
                    하나씩 연습
                </button>
                <button
                    className={`tab-btn ${view === 'test' ? 'active' : ''}`}
                    onClick={() => setView('test')}
                >
                    전체 시험
                </button>
            </nav>

            <main className="content-area">
                {view === 'add' && (
                    <AddWordClient
                        words={words}
                        onAdd={addWord}
                        onDelete={deleteWord}
                    />
                )}
                {view === 'practice' && (
                    <PracticeMode words={words} />
                )}
                {view === 'test' && (
                    <TestMode words={words} />
                )}
            </main>
        </div>
    )
}

function AddWordClient({ words, onAdd, onDelete }) {
    const [inputWord, setInputWord] = useState('')
    const [inputType, setInputType] = useState('countable')

    const handleSubmit = (e) => {
        e.preventDefault()
        onAdd(inputWord, inputType)
        setInputWord('')
    }

    return (
        <div className="view-container">
            <form onSubmit={handleSubmit} className="add-form card">
                <h3>새 단어 추가하기</h3>
                <div className="form-group">
                    <input
                        type="text"
                        value={inputWord}
                        onChange={(e) => setInputWord(e.target.value)}
                        placeholder="영어 단어를 입력하세요..."
                        className="input-field"
                        autoFocus
                    />
                    <select
                        value={inputType}
                        onChange={(e) => setInputType(e.target.value)}
                        className="select-field"
                    >
                        <option value="countable">가산명사</option>
                        <option value="uncountable">불가산명사</option>
                    </select>
                    <button type="submit" className="btn-primary">추가</button>
                </div>
            </form>

            <div className="word-list card">
                <h3>내 단어장 ({words.length})</h3>
                {words.length === 0 ? (
                    <p className="empty-state">아직 추가된 단어가 없습니다. 단어를 등록해주세요!</p>
                ) : (
                    <ul>
                        {words.map(w => (
                            <li key={w.id} className="word-item">
                                <span className="word-text">{w.word}</span>
                                <span className={`badge ${w.type}`}>
                                    {w.type === 'countable' ? '가산명사' : '불가산명사'}
                                </span>
                                <button
                                    onClick={() => onDelete(w.id)}
                                    className="btn-delete"
                                    title="삭제"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function PracticeMode({ words }) {
    const [currentWord, setCurrentWord] = useState(null)
    const [lastResult, setLastResult] = useState(null) // 'correct', 'incorrect'
    const [streak, setStreak] = useState(0)

    const nextWord = () => {
        if (words.length === 0) return
        const random = words[Math.floor(Math.random() * words.length)]
        setCurrentWord(random)
        setLastResult(null)
    }

    useEffect(() => {
        nextWord()
    }, [words])

    const checkAnswer = (type) => {
        if (!currentWord) return
        const isCorrect = currentWord.type === type
        setLastResult(isCorrect ? 'correct' : 'incorrect')
        if (isCorrect) setStreak(s => s + 1)
        else setStreak(0)
    }

    if (words.length === 0) {
        return <div className="card empty-state">먼저 단어장에 단어를 추가해주세요!</div>
    }

    if (!currentWord) return null

    return (
        <div className="practice-view card">
            <div className="streak-badge">연속 정답: {streak}</div>
            <div className="flashcard">
                <h2 className="check-word">{currentWord.word}</h2>
            </div>

            {!lastResult ? (
                <div className="actions">
                    <button
                        className="btn-choice countable"
                        onClick={() => checkAnswer('countable')}
                    >
                        가산
                    </button>
                    <button
                        className="btn-choice uncountable"
                        onClick={() => checkAnswer('uncountable')}
                    >
                        불가산
                    </button>
                </div>
            ) : (
                <div className={`result ${lastResult}`}>
                    <h3>{lastResult === 'correct' ? '정답입니다!' : '틀렸습니다.'}</h3>
                    <p>
                        <strong>{currentWord.word}</strong>은(는)
                        <span className={`badge ${currentWord.type} inline-badge`}>
                            {currentWord.type === 'countable' ? '가산명사' : '불가산명사'}
                        </span>
                        입니다.
                    </p>
                    <button className="btn-primary" onClick={nextWord} autoFocus>
                        다음 문제 →
                    </button>
                </div>
            )}
        </div>
    )
}

function TestMode({ words }) {
    const [testWords, setTestWords] = useState([])
    const [answers, setAnswers] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    // Shuffle words helper
    const shuffle = (array) => {
        return [...array].sort(() => Math.random() - 0.5)
    }

    // Initialize test with shuffled words
    useEffect(() => {
        setTestWords(shuffle(words))
        setAnswers({})
        setSubmitted(false)
        setScore(0)
    }, [words])

    const handleSelect = (id, value) => {
        setAnswers(prev => ({ ...prev, [id]: value }))
    }

    const handleSubmit = () => {
        let correctCount = 0
        testWords.forEach(w => {
            if (answers[w.id] === w.type) {
                correctCount++
            }
        })
        setScore(correctCount)
        setSubmitted(true)
    }

    const reset = () => {
        setTestWords(shuffle(words))
        setAnswers({})
        setSubmitted(false)
        setScore(0)
    }

    if (words.length === 0) {
        return <div className="card empty-state">테스트를 진행할 단어가 없습니다. 먼저 단어를 추가해주세요!</div>
    }

    return (
        <div className="test-view card">
            {!submitted ? (
                <>
                    <h3>실력 테스트</h3>
                    <p className="instruction">각 단어가 가산명사인지 불가산명사인지 선택하세요.</p>
                    <ul className="test-list">
                        {testWords.map(w => (
                            <li key={w.id} className="test-item">
                                <span className="test-word">{w.word}</span>
                                <div className="test-options">
                                    <label className={`radio-label ${answers[w.id] === 'countable' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name={`q-${w.id}`}
                                            value="countable"
                                            checked={answers[w.id] === 'countable'}
                                            onChange={() => handleSelect(w.id, 'countable')}
                                        /> 가산
                                    </label>
                                    <label className={`radio-label ${answers[w.id] === 'uncountable' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name={`q-${w.id}`}
                                            value="uncountable"
                                            checked={answers[w.id] === 'uncountable'}
                                            onChange={() => handleSelect(w.id, 'uncountable')}
                                        /> 불가산
                                    </label>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="test-actions">
                        <button
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={Object.keys(answers).length < words.length}
                        >
                            제출하기 ({Object.keys(answers).length}/{words.length})
                        </button>
                    </div>
                </>
            ) : (
                <div className="test-result">
                    <div className="score-circle">
                        <span className="score-num">{Math.round((score / words.length) * 100)}%</span>
                        <span className="score-detail">{score} / {words.length} 정답</span>
                    </div>

                    <h3>결과 확인</h3>
                    <ul className="review-list">
                        {testWords.map(w => {
                            const isCorrect = answers[w.id] === w.type
                            const typeText = (t) => t === 'countable' ? '가산' : '불가산'

                            return (
                                <li key={w.id} className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                                    <span className="review-word">{w.word}</span>
                                    <div className="review-detail">
                                        <span className="user-ans">나의 답: {typeText(answers[w.id])}</span>
                                        {!isCorrect && <span className="correct-ans">정답: {typeText(w.type)}</span>}
                                    </div>
                                    <span className="icon">{isCorrect ? 'O' : 'X'}</span>
                                </li>
                            )
                        })}
                    </ul>
                    <button className="btn-primary" onClick={reset}>다시 풀기</button>
                </div>
            )}
        </div>
    )
}
