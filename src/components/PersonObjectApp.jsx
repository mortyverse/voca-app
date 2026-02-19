import { useState, useEffect } from 'react'

export default function PersonObjectApp({ isMaximized }) {
    const [pairs, setPairs] = useState([])
    const [view, setView] = useState('add') // 'add', 'quiz'

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch data
                const response = await fetch('http://localhost:3000/pairs')
                const data = await response.json()
                setPairs(data)
            } catch (error) {
                console.error('Failed to fetch pairs:', error)
            }
        }
        fetchData()
    }, [])

    const addPair = async (person, object) => {
        if (!person.trim() || !object.trim()) return
        try {
            const newPair = { person: person.trim(), object: object.trim() }
            const response = await fetch('http://localhost:3000/pairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPair)
            })
            const savedPair = await response.json()
            setPairs([...pairs, savedPair])
        } catch (error) {
            console.error('Failed to add pair:', error)
        }
    }

    const deletePair = async (id) => {
        try {
            await fetch(`http://localhost:3000/pairs/${id}`, {
                method: 'DELETE'
            })
            setPairs(pairs.filter(p => p.id !== id))
        } catch (error) {
            console.error('Failed to delete pair:', error)
        }
    }

    return (
        <div className="container">
            {!isMaximized && (
                <header className="header">
                    <h1>사람 vs 사물/추상</h1>
                    <p className="subtitle">짝지어진 단어를 외우고 퀴즈를 풀어보세요.</p>
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
                    className={`tab-btn ${view === 'quiz' ? 'active' : ''}`}
                    onClick={() => setView('quiz')}
                >
                    퀴즈 풀기
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
                    <AddPairClient
                        pairs={pairs}
                        onAdd={addPair}
                        onDelete={deletePair}
                    />
                )}
                {view === 'quiz' && (
                    <QuizMode pairs={pairs} />
                )}
                {view === 'test' && (
                    <TestMode pairs={pairs} />
                )}
            </main>
        </div>
    )
}

function AddPairClient({ pairs, onAdd, onDelete }) {
    const [personWord, setPersonWord] = useState('')
    const [objectWord, setObjectWord] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        onAdd(personWord, objectWord)
        setPersonWord('')
        setObjectWord('')
        // Focus back on first input?
        document.getElementById('person-input')?.focus()
    }

    return (
        <div className="view-container">
            <form onSubmit={handleSubmit} className="add-form card">
                <h3>새 단어 쌍 추가하기</h3>
                <p className="instruction-text">서로 연관된 사람 명사와 사물/추상 명사를 입력하세요.</p>
                <div className="form-group-vertical">
                    <input
                        id="person-input"
                        type="text"
                        value={personWord}
                        onChange={(e) => setPersonWord(e.target.value)}
                        placeholder="사람 명사 (예: Artist)"
                        className="input-field"
                        autoFocus
                    />
                    <input
                        type="text"
                        value={objectWord}
                        onChange={(e) => setObjectWord(e.target.value)}
                        placeholder="사물/추상 명사 (예: Art)"
                        className="input-field"
                    />
                    <button type="submit" className="btn-primary full-width">추가</button>
                </div>
            </form>

            <div className="word-list card">
                <h3>내 단어장 ({pairs.length})</h3>
                {pairs.length === 0 ? (
                    <p className="empty-state">아직 추가된 단어가 없습니다.</p>
                ) : (
                    <ul className="pair-list">
                        {pairs.map(p => (
                            <li key={p.id} className="pair-item">
                                <div className="pair-content">
                                    <span className="pair-label">사람:</span> <strong>{p.person}</strong>
                                    <span className="pair-arrow">↔</span>
                                    <span className="pair-label">사물:</span> <strong>{p.object}</strong>
                                </div>
                                <button
                                    onClick={() => onDelete(p.id)}
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

function QuizMode({ pairs }) {
    const [currentPair, setCurrentPair] = useState(null)
    const [direction, setDirection] = useState('personToObj') // 'personToObj' or 'objToPerson'
    const [userAnswer, setUserAnswer] = useState('')
    const [lastResult, setLastResult] = useState(null) // 'correct', 'incorrect'
    const [streak, setStreak] = useState(0)

    const nextQuestion = () => {
        if (pairs.length === 0) return
        const randomPair = pairs[Math.floor(Math.random() * pairs.length)]
        const randomDir = Math.random() > 0.5 ? 'personToObj' : 'objToPerson'

        setCurrentPair(randomPair)
        setDirection(randomDir)
        setUserAnswer('')
        setLastResult(null)
    }

    useEffect(() => {
        nextQuestion()
    }, [pairs])

    const checkAnswer = (e) => {
        e.preventDefault()
        if (!currentPair) return

        const correctAnswer = direction === 'personToObj' ? currentPair.object : currentPair.person
        const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()

        setLastResult(isCorrect ? 'correct' : 'incorrect')
        if (isCorrect) setStreak(s => s + 1)
        else setStreak(0)
    }

    if (pairs.length === 0) {
        return <div className="card empty-state">단어장에 단어 쌍을 추가해주세요!</div>
    }

    if (!currentPair) return null

    const questionWord = direction === 'personToObj' ? currentPair.person : currentPair.object
    const questionType = direction === 'personToObj' ? '사람 명사' : '사물/추상 명사'
    const targetType = direction === 'personToObj' ? '사물/추상 명사' : '사람 명사'

    return (
        <div className="practice-view card">
            <div className="streak-badge">연속 정답: {streak}</div>

            <div className="quiz-container">
                <span className="question-type-label">제시어 ({questionType})</span>
                <h2 className="check-word">{questionWord}</h2>
            </div>

            {!lastResult ? (
                <form onSubmit={checkAnswer} className="quiz-form">
                    <p className="instruction-text">위 단어에 대응하는 <strong>{targetType}</strong>를 입력하세요.</p>
                    <div className="quiz-input-group">
                        <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="정답 입력..."
                            className="input-field large-input"
                            autoFocus
                        />
                        <button type="submit" className="btn-primary">확인</button>
                    </div>
                </form>
            ) : (
                <div className={`result ${lastResult}`}>
                    <h3>{lastResult === 'correct' ? '정답입니다!' : '틀렸습니다.'}</h3>

                    <div className="result-detail">
                        <p>
                            <strong>{questionWord}</strong> ({questionType})
                            <br />
                            ↕
                            <br />
                            <strong className="answer-highlight">{direction === 'personToObj' ? currentPair.object : currentPair.person}</strong> ({targetType})
                        </p>
                        {lastResult === 'incorrect' && (
                            <p className="your-answer">당신의 답: {userAnswer}</p>
                        )}
                    </div>

                    <button className="btn-primary" onClick={nextQuestion} autoFocus>
                        다음 문제 →
                    </button>
                </div>
            )}
        </div>
    )
}

function TestMode({ pairs }) {
    const [testItems, setTestItems] = useState([])
    const [answers, setAnswers] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    // Shuffle and Prepare Test Items
    useEffect(() => {
        reset()
    }, [pairs])

    const reset = () => {
        const shuffled = [...pairs]
            .sort(() => Math.random() - 0.5)
            .map(p => ({
                id: p.id,
                pair: p,
                direction: Math.random() > 0.5 ? 'personToObj' : 'objToPerson'
            }))
        setTestItems(shuffled)
        setAnswers({})
        setSubmitted(false)
        setScore(0)
    }

    const handleInput = (id, value) => {
        setAnswers(prev => ({ ...prev, [id]: value }))
    }

    const handleSubmit = () => {
        let correctCount = 0
        testItems.forEach(item => {
            const correctAnswer = item.direction === 'personToObj' ? item.pair.object : item.pair.person
            const userAnswer = answers[item.id] || ''
            if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
                correctCount++
            }
        })
        setScore(correctCount)
        setSubmitted(true)
    }

    if (pairs.length === 0) {
        return <div className="card empty-state">테스트를 진행할 단어가 없습니다. 먼저 단어를 추가해주세요!</div>
    }

    return (
        <div className="test-view card">
            {!submitted ? (
                <>
                    <h3>실력 테스트</h3>
                    <p className="instruction">제시된 단어에 대응하는 짝 단어를 입력하세요.</p>
                    <ul className="test-list-vertical">
                        {testItems.map((item, index) => {
                            const questionWord = item.direction === 'personToObj' ? item.pair.person : item.pair.object
                            const targetType = item.direction === 'personToObj' ? '사물/추상' : '사람'

                            return (
                                <li key={item.id} className="test-item-input">
                                    <div className="test-prompt">
                                        <span className="question-number">{index + 1}.</span>
                                        <div className="word-stack">
                                            <span className="prompt-word">{questionWord}</span>
                                            <span className="prompt-hint">({item.direction === 'personToObj' ? '사람' : '사물'}) → {targetType}</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="정답 입력"
                                        value={answers[item.id] || ''}
                                        onChange={(e) => handleInput(item.id, e.target.value)}
                                    />
                                </li>
                            )
                        })}
                    </ul>
                    <div className="test-actions">
                        <button
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={Object.keys(answers).length < testItems.length}
                        >
                            제출하기 ({Object.keys(answers).length}/{testItems.length})
                        </button>
                    </div>
                </>
            ) : (
                <div className="test-result">
                    <div className="score-circle">
                        <span className="score-num">{Math.round((score / testItems.length) * 100)}%</span>
                        <span className="score-detail">{score} / {testItems.length} 정답</span>
                    </div>

                    <h3>결과 확인</h3>
                    <ul className="review-list">
                        {testItems.map(item => {
                            const correctAnswer = item.direction === 'personToObj' ? item.pair.object : item.pair.person
                            const userAnswer = answers[item.id] || ''
                            const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
                            const questionWord = item.direction === 'personToObj' ? item.pair.person : item.pair.object

                            return (
                                <li key={item.id} className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                                    <div className="review-qa">
                                        <div className="qa-pair">
                                            <span className="q-label">Q: {questionWord}</span>
                                            <span className="arrow">→</span>
                                            <span className="a-label correction">{correctAnswer}</span>
                                        </div>
                                        <div className="user-input-display">
                                            내가 쓴 답: <span className={isCorrect ? 'correct-text' : 'wrong-text'}>{userAnswer}</span>
                                        </div>
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
