import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

// Helper for ID generation (outside component to satisfy linter purity)
let nextId = 0;
const generateId = () => ++nextId;

// Fisher-Yates Shuffle
const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

export default function FiveStepStudyApp({ isMaximized, initialWords, onClearInitialWords }) {
    // Session state
    const [sessionWords, setSessionWords] = useState([])
    const [step, setStep] = useState(1) // 1 to 9, 10=Summary
    const [mode, setMode] = useState('easy') // 'easy' | 'hard'
    const [targetStage, setTargetStage] = useState(5) // Default 5 stages

    // For Stage 1
    const [inputRows, setInputRows] = useState(() => [{ id: Date.now(), eng: '', kor: '' }])

    useEffect(() => {
        if (initialWords && initialWords.length > 0) {
            // Load initial words into input stage
            // We need to give them new temporary IDs for this session to avoid conflicts or just usage
            const formatted = initialWords.map(w => ({
                id: generateId(), // Create new session ID
                eng: w.eng,
                kor: w.kor
            }))
            // Add one empty row at the end
            setInputRows([...formatted, { id: generateId(), eng: '', kor: '' }])
            setStep(1) // Ensure we are at step 1

            // Clear the initial words prop so we don't re-load
            if (onClearInitialWords) {
                onClearInitialWords()
            }
        }
    }, [initialWords, onClearInitialWords])

    const handleSave = (validRows) => {
        if (validRows.length === 0) {
            alert('단어를 입력해주세요.')
            return
        }
        setSessionWords(validRows)
        setStep(2)
    }

    const maxStep = (targetStage - 1) * 2 + 1

    const handleNextStep = () => {
        if (step < maxStep) {
            setStep(prev => prev + 1)
        } else {
            setStep(10) // Summary
            confetti({
                particleCount: 150,
                spread: 60,
                origin: { y: 0.6 }
            })
        }
    }

    const handleEarlyExit = () => {
        setStep(10) // Jump to Summary
    }

    const handleRestart = () => {
        setStep(1)
        setInputRows([{ id: Date.now(), eng: '', kor: '' }])
        setSessionWords([])
    }

    // Calculate visual stage (1-5) based on internal step (1-9)
    const visualStage = (() => {
        if (step === 1) return 1
        if (step === 2 || step === 3) return 2
        if (step === 4 || step === 5) return 3
        if (step === 6 || step === 7) return 4
        if (step === 8 || step === 9) return 5
        return 5 // Summary
    })()

    return (
        <div className="container">
            {!isMaximized && (
                <header className="header">
                    <h1>단어 암기 (5단계)</h1>
                    <p className="subtitle">반복 학습으로 단어를 완벽하게 외우세요.</p>
                </header>
            )}

            {step <= 9 && (
                <div className="progress__container">
                    <div className="progress-bar-container">
                        {[1, 2, 3, 4, 5].map(s => {
                            if (s > targetStage) return null
                            return (
                                <div key={s} className={`step-indicator ${visualStage >= s ? 'active' : ''}`}>
                                    {s}단계 {s === 1 ? '(입력)' : ''}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <main className="content-area">
                {step === 1 && (
                    <InputStage
                        rows={inputRows}
                        setRows={setInputRows}
                        onSave={handleSave}
                        mode={mode}
                        setMode={setMode}
                        targetStage={targetStage}
                        setTargetStage={setTargetStage}
                    />
                )}
                {/* Steps 2-9 use TestStage */}
                {[2, 3, 4, 5, 6, 7, 8, 9].includes(step) && (
                    <TestStage
                        key={step}
                        words={sessionWords}
                        direction={(step % 2 === 0) ? "korToEng" : "engToKor"} // Even steps are Kor->Eng, Odd are Eng->Kor
                        allowHint={step <= 5} // Steps 2,3,4,5 have hints. 6,7,8,9 don't.
                        onComplete={handleNextStep}
                        onEarlyExit={handleEarlyExit}
                        stageNum={step}
                        totalSteps={maxStep}
                        isHardMode={mode === 'hard'}
                    />
                )}

                {step === 10 && (
                    <SummaryStage words={sessionWords} onRestart={handleRestart} />
                )}
            </main>
        </div>
    )
}

function InputStage({ rows, setRows, onSave, mode, setMode, targetStage, setTargetStage }) {
    const tableEndRef = useRef(null)

    const handleChange = (id, field, value) => {
        const newRows = rows.map(row => row.id === id ? { ...row, [field]: value } : row)
        setRows(newRows)
        const lastRow = newRows[newRows.length - 1]
        if (lastRow.id === id && (lastRow.eng || lastRow.kor)) {
            setRows([...newRows, { id: generateId(), eng: '', kor: '' }])
        }
    }

    const deleteRow = (id) => {
        if (rows.length <= 1) {
            setRows([{ id: Date.now(), eng: '', kor: '' }])
            return
        }
        setRows(rows.filter(row => row.id !== id))
    }

    const handleSaveClick = () => {
        const valid = rows.filter(r => r.eng.trim() && r.kor.trim())
        onSave(valid)
    }

    const handleKeyDown = (e, index, field) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const nextId = `input-${field}-${index + 1}`
            const nextElement = document.getElementById(nextId)
            if (nextElement) {
                nextElement.focus()
            }
        }
    }

    return (
        <div className="card">
            <div className="stage-header">
                <h3>단어 입력 (1단계)</h3>
                <p className="instruction-text">영어 단어와 뜻을 입력하세요.</p>

                <div className="form-group" style={{ flexWrap: 'wrap', alignItems: 'flex-start', flexDirection: 'column', gap: '1.5rem' }}>

                    <div className="setting-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span className="setting-label" style={{ fontWeight: '600', color: '#555' }}>학습 모드:</span>
                        <div className="option-group">
                            <label className={`option-card ${mode === 'easy' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="mode"
                                    value="easy"
                                    checked={mode === 'easy'}
                                    onChange={() => setMode('easy')}
                                />
                                <span className="icon">🌱</span> Easy (순서대로)
                            </label>
                            <label className={`option-card ${mode === 'hard' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="mode"
                                    value="hard"
                                    checked={mode === 'hard'}
                                    onChange={() => setMode('hard')}
                                />
                                <span className="icon">🔥</span> Hard (랜덤)
                            </label>
                        </div>
                    </div>

                    <div className="setting-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span className="setting-label" style={{ fontWeight: '600', color: '#555' }}>목표 단계:</span>
                        <div className="option-group">
                            {[2, 3, 4, 5].map(s => (
                                <label key={s} className={`option-card ${targetStage === s ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="targetStage"
                                        value={s}
                                        checked={targetStage === s}
                                        onChange={() => setTargetStage(s)}
                                    />
                                    {s}단계
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="input-table-container">
                <table className="input-table">
                    <thead>
                        <tr>
                            <th style={{ width: '45%' }}>영어 단어</th>
                            <th style={{ width: '45%' }}>한글 뜻</th>
                            <th style={{ width: '10%' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => {
                            const isPhantom = index === rows.length - 1 && !row.eng && !row.kor
                            return (
                                <tr key={row.id} className={isPhantom ? 'phantom-row' : ''}>
                                    <td>
                                        <input
                                            id={`input-eng-${index}`}
                                            type="text"
                                            placeholder={isPhantom ? "클릭하여 추가..." : "English"}
                                            value={row.eng}
                                            onChange={(e) => handleChange(row.id, 'eng', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index, 'eng')}
                                            autoComplete="off"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            id={`input-kor-${index}`}
                                            type="text"
                                            placeholder={isPhantom ? "" : "한글 뜻"}
                                            value={row.kor}
                                            onChange={(e) => handleChange(row.id, 'kor', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index, 'kor')}
                                            disabled={isPhantom && !row.eng}
                                            autoComplete="off"
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {!isPhantom && (
                                            <button
                                                className="btn-delete-mini"
                                                onClick={() => deleteRow(row.id)}
                                                tabIndex={-1}
                                                style={{ color: '#ccc', fontSize: '1.2rem', padding: '0.5rem', cursor: 'pointer', background: 'none', border: 'none' }}
                                                onMouseOver={(e) => e.target.style.color = '#ef4444'}
                                                onMouseOut={(e) => e.target.style.color = '#ccc'}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        <tr ref={tableEndRef}></tr>
                    </tbody>
                </table>
            </div>

            <div className="actions-row right-align" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button className="btn-primary" onClick={handleSaveClick}>저장 및 학습 시작 →</button>
            </div>
        </div>
    )
}

function TestStage({ words, direction, allowHint, onComplete, onEarlyExit, stageNum, totalSteps, isHardMode }) {
    const [displayWords, setDisplayWords] = useState(() => {
        if (isHardMode) return [...words].sort(() => Math.random() - 0.5)
        return words
    })

    const [userInput, setUserInput] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [results, setResults] = useState({})

    // Hint state: storing which words have hint active
    const [activeHints, setActiveHints] = useState({})

    const handleInputChange = (id, value) => {
        setUserInput(prev => ({ ...prev, [id]: value }))
    }

    const checkAnswers = () => {
        const newResults = {}
        let correctCount = 0
        displayWords.forEach(w => {
            const correctAnswer = direction === 'korToEng' ? w.eng : w.kor
            const input = userInput[w.id] || ''
            // Simple robust check: ignore spaces and case
            const isCorrect = input.trim().replace(/\s+/g, '').toLowerCase() === correctAnswer.trim().replace(/\s+/g, '').toLowerCase()
            newResults[w.id] = isCorrect
            if (isCorrect) correctCount++
        })
        setResults(newResults)
        setSubmitted(true)
    }

    const toggleHint = (id) => {
        setActiveHints(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const nextInput = document.querySelector(`input[name="word-input-${index + 1}"]`)
            if (nextInput) nextInput.focus()
            else if (index === displayWords.length - 1) checkAnswers() // Submit on last enter
        }
    }

    const getPrompt = () => direction === 'korToEng' ? '한글 뜻을 보고 영어 단어를 입력하세요' : '영어 단어를 보고 한글 뜻을 입력하세요'

    return (
        <div className="card test-stage-card">
            <div className="stage-header">
                <h3>{getPrompt()}</h3>
                <span className="step-badge">{stageNum}/{totalSteps} 단계</span>
            </div>

            <div className="test-word-list">
                {displayWords.map((word, index) => {
                    const questionText = direction === 'korToEng' ? word.kor : word.eng
                    const answerText = direction === 'korToEng' ? word.eng : word.kor
                    const isCorrect = results[word.id]

                    return (
                        <div key={word.id} className={`test-row-item ${submitted ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
                            <div className="question-part">
                                <span className="q-number">{index + 1}.</span>
                                <span className="q-word">{questionText}</span>
                            </div>

                            <div className="answer-part">
                                {!submitted ? (
                                    <>
                                        <input
                                            type="text"
                                            name={`word-input-${index}`}
                                            className="input-field"
                                            placeholder="답 입력"
                                            value={userInput[word.id] || ''}
                                            onChange={(e) => handleInputChange(word.id, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            autoComplete="off"
                                            autoFocus={index === 0}
                                            onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                        />
                                        {allowHint && (
                                            <div className="hint-container">
                                                <button
                                                    className="btn-hint-icon"
                                                    onClick={() => toggleHint(word.id)}
                                                    tabIndex={-1}
                                                    title="힌트 보기"
                                                >
                                                    ?
                                                </button>
                                                {activeHints[word.id] && (
                                                    <div className="hint-bubble">
                                                        {answerText}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="result-feedback">
                                        <span className={`user-answer ${isCorrect ? 'correct-text' : 'wrong-text'}`}>
                                            {userInput[word.id] || '(미입력)'}
                                        </span>
                                        <span className="feedback-icon">{isCorrect ? '⭕' : '❌'}</span>
                                        {!isCorrect && (
                                            <span className="correct-answer-display">
                                                정답: <strong>{answerText}</strong>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="actions-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn-secondary" onClick={onEarlyExit}>조기 종료</button>
                {!submitted ? (
                    <button className="btn-primary" onClick={checkAnswers}>정답 확인</button>
                ) : (
                    <button className="btn-primary" onClick={onComplete}>다음 단계로 →</button>
                )}
            </div>
        </div>
    )
}

function SummaryStage({ words, onRestart }) {
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [folders, setFolders] = useState([])
    const [selectedFolderId, setSelectedFolderId] = useState('')
    const [newSubFolderName, setNewSubFolderName] = useState('')
    const [isCreatingNew, setIsCreatingNew] = useState(false)
    const [targetParentId, setTargetParentId] = useState(null)

    const API_URL = 'http://localhost:3000/folders'

    useEffect(() => {
        if (showSaveDialog) {
            fetch(API_URL)
                .then(res => res.json())
                .then(data => {
                    setFolders(data)
                    // Default selection logic: find first valid sub-folder
                    const firstSub = data.find(f => f.parentId)
                    if (firstSub) setSelectedFolderId(firstSub.id)
                })
                .catch(err => console.error("Failed to load folders", err))
        }
    }, [showSaveDialog])

    const handleSaveToFolder = async () => {
        if (isCreatingNew) {
            if (!newSubFolderName.trim()) {
                alert('새 폴더 이름을 입력해주세요.')
                return
            }
            if (!targetParentId) {
                alert('상위 폴더를 선택해주세요.')
                return
            }

            const newFolder = {
                id: Date.now().toString(),
                name: newSubFolderName,
                parentId: targetParentId,
                color: '#FFD700', // Default color
                words: words.map(w => ({ ...w, id: Date.now() + Math.random().toString() }))
            }

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newFolder)
                })
                if (res.ok) {
                    alert('새 폴더에 저장되었습니다!')
                    setShowSaveDialog(false)
                } else {
                    const errorData = await res.json()
                    alert('저장 실패: ' + (errorData.message || res.statusText))
                }
            } catch (e) {
                alert('저장 실패: ' + e.message)
            }
        } else {
            if (!selectedFolderId) {
                alert('저장할 폴더를 선택해주세요.')
                return
            }

            const targetFolder = folders.find(f => f.id === selectedFolderId)
            if (!targetFolder) {
                alert('선택된 폴더를 찾을 수 없습니다.')
                return
            }

            const newWords = words.map(w => ({ ...w, id: Date.now() + Math.random().toString() }))
            const updatedWords = [...targetFolder.words, ...newWords]

            try {
                const res = await fetch(`${API_URL}/${selectedFolderId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ words: updatedWords })
                })
                if (res.ok) {
                    alert('단어장에 저장되었습니다!')
                    setShowSaveDialog(false)
                } else {
                    const errorData = await res.json()
                    alert('저장 실패: ' + (errorData.message || res.statusText))
                }
            } catch (e) {
                alert('저장 실패: ' + e.message)
            }
        }
    }

    // Groupping for select
    const rootFolders = folders.filter(f => !f.parentId)
    const getSubFolders = (parentId) => folders.filter(f => f.parentId === parentId)

    return (
        <div className="card summary-view">
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>🎉 학습 완료! 🎉</h2>
            <p style={{ textAlign: 'center', marginBottom: '2rem' }}>모든 단어 학습을 마쳤습니다. 수고하셨습니다.</p>

            <div className="summary-list">
                <h3>학습한 단어</h3>
                <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    {words.map((w, i) => (
                        <li key={i} style={{ marginBottom: '0.5rem' }}>
                            <strong style={{ marginRight: '0.5rem' }}>{w.eng}</strong>
                            <span style={{ color: '#666' }}>{w.kor}</span>
                        </li>
                    ))}
                </ol>
            </div>

            <div className="actions-row center-align" style={{ gap: '3rem', marginTop: '3rem', justifyContent: 'center', display: 'flex' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="btn-secondary" onClick={() => setShowSaveDialog(true)} style={{ minWidth: '160px' }}>
                        📥 단어장에 저장하기
                    </button>
                    {/* Helper text removed as buttons are spaced enough now */}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="btn-primary" onClick={onRestart} autoFocus style={{ minWidth: '160px' }}>
                        🔄 새로운 단어 학습하기
                    </button>
                </div>
            </div>

            {showSaveDialog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '450px', maxWidth: '90%' }}>
                        <h3 style={{ marginTop: 0, textAlign: 'center' }}>단어장 선택</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center', marginBottom: '1.5rem' }}>
                            저장할 소분류 폴더를 선택하세요.
                        </p>

                        <div className="form-group-vertical">
                            {!isCreatingNew ? (
                                <>
                                    <select
                                        className="select-field"
                                        value={selectedFolderId}
                                        onChange={(e) => {
                                            if (e.target.value === 'CREATE_NEW') {
                                                setIsCreatingNew(true)
                                                setNewSubFolderName('')
                                                // Default to first root if available
                                                if (rootFolders.length > 0) setTargetParentId(rootFolders[0].id)
                                            } else {
                                                setSelectedFolderId(e.target.value)
                                            }
                                        }}
                                        style={{ width: '100%', padding: '0.8rem' }}
                                    >
                                        <option value="" disabled>폴더를 선택하세요</option>
                                        {rootFolders.map(root => {
                                            const subs = getSubFolders(root.id)
                                            return (
                                                <optgroup key={root.id} label={root.name}>
                                                    {subs.map(sub => (
                                                        <option key={sub.id} value={sub.id}>
                                                            {sub.name} ({sub.words.length}개)
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )
                                        })}
                                        <option value="CREATE_NEW" style={{ fontWeight: 'bold', color: '#007bff' }}>
                                            + 새 하위 폴더 만들기...
                                        </option>
                                    </select>
                                </>
                            ) : (
                                <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>상위 폴더 (대분류)</label>
                                    <select
                                        className="select-field"
                                        value={targetParentId || ''}
                                        onChange={e => setTargetParentId(e.target.value)}
                                        style={{ width: '100%', marginBottom: '1rem' }}
                                    >
                                        {rootFolders.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>

                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>새 폴더 이름</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="예: Day 1, Chapter 1..."
                                        value={newSubFolderName}
                                        onChange={(e) => setNewSubFolderName(e.target.value)}
                                        style={{ width: '100%' }}
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="actions-row" style={{ marginTop: '2rem', justifyContent: 'space-between', display: 'flex' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        if (isCreatingNew) setIsCreatingNew(false)
                                        else setShowSaveDialog(false)
                                    }}
                                >
                                    {isCreatingNew ? '뒤로' : '취소'}
                                </button>
                                <button className="btn-primary" onClick={handleSaveToFolder}>
                                    {isCreatingNew ? '새 폴더에 저장' : '선택한 폴더에 저장'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
