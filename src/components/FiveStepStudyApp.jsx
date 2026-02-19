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
            setRows([{ id: generateId(), eng: '', kor: '' }])
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
                <div>
                    <h3>단어 입력 (1단계)</h3>
                    <p className="instruction-text">영어 단어와 뜻을 입력하세요. (Enter: 아래 칸으로 이동)</p>
                </div>
                <div className="mode-selector">
                    <label className={`mode-btn ${mode === 'easy' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="mode"
                            value="easy"
                            checked={mode === 'easy'}
                            onChange={() => setMode('easy')}
                        />
                        Easy (순서대로)
                    </label>
                    <label className={`mode-btn ${mode === 'hard' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="mode"
                            value="hard"
                            checked={mode === 'hard'}
                            onChange={() => setMode('hard')}
                        />
                        Hard (랜덤)
                    </label>
                </div>
                <div className="stage-selector" style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold' }}>목표 단계:</span>
                    {[2, 3, 4, 5].map(s => (
                        <label key={s} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

            <div className="input-table-container">
                <table className="input-table">
                    <thead>
                        <tr>
                            <th>영어 단어</th>
                            <th>한글 뜻</th>
                            <th style={{ width: '50px' }}></th>
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
                                            className="input-field"
                                            placeholder={isPhantom ? "클릭하여 추가..." : "English"}
                                            value={row.eng}
                                            onChange={(e) => handleChange(row.id, 'eng', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index, 'eng')}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            id={`input-kor-${index}`}
                                            type="text"
                                            className="input-field"
                                            placeholder={isPhantom ? "" : "한글 뜻"}
                                            value={row.kor}
                                            onChange={(e) => handleChange(row.id, 'kor', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index, 'kor')}
                                            disabled={isPhantom && !row.eng}
                                        />
                                    </td>
                                    <td>
                                        {!isPhantom && (
                                            <button
                                                className="btn-delete-mini"
                                                onClick={() => deleteRow(row.id)}
                                                tabIndex={-1}
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

            <div className="actions-row right-align">
                <button className="btn-primary" onClick={handleSaveClick}>저장 및 학습 시작</button>
            </div>
        </div>
    )
}

function TestStage({ words, direction, allowHint, onComplete, onEarlyExit, stageNum, totalSteps, isHardMode }) {
    const [displayWords] = useState(() => {
        if (isHardMode) return shuffleArray(words)
        return words
    })

    const [mode, setMode] = useState('input')
    const [inputs, setInputs] = useState(() => {
        const initial = {}
        displayWords.forEach(w => initial[w.id] = '')
        return initial
    })

    const [results, setResults] = useState({})
    const [hints, setHints] = useState({})
    const firstInputRef = useRef(null)

    useEffect(() => {
        if (firstInputRef.current) {
            firstInputRef.current.focus()
        }
    }, [])

    const handleCheck = () => {
        const newResults = {}
        displayWords.forEach(w => {
            const answer = direction === 'korToEng' ? w.eng : w.kor
            const userVal = inputs[w.id] || ''
            // Ignore whitespaces
            const isCorrect = userVal.replace(/\s+/g, '').toLowerCase() === answer.replace(/\s+/g, '').toLowerCase()
            newResults[w.id] = isCorrect
        })
        setResults(newResults)
        setMode('result')
    }

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const nextInput = document.getElementById(`test-input-${index + 1}`)
            if (nextInput) {
                nextInput.focus()
            }
        }
    }

    const toggleHint = (id) => {
        setHints(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const getPromptText = () => {
        if (direction === 'korToEng') return '한글 뜻을 보고 영어 단어를 입력하세요'
        return '영어 단어를 보고 한글 뜻을 입력하세요'
    }

    const isLargeList = displayWords.length > 10

    const handleEarlyExitClick = () => {
        if (window.confirm('학습을 조기에 종료하시겠습니까? 완료 화면으로 이동하여 단어를 저장할 수 있습니다.')) {
            onEarlyExit()
        }
    }

    return (
        <div className="card">
            <div className="stage-header">
                <h3>{getPromptText()}</h3>
                <span className="step-badge">{stageNum}/{totalSteps} 과정</span>
            </div>
            {!allowHint && <p className="warning-text">※ 이제 힌트가 제공되지 않습니다.</p>}

            <div className={`test-list ${isLargeList ? 'multi-col' : ''}`}>
                {displayWords.map((w, index) => {
                    const question = direction === 'korToEng' ? w.kor : w.eng
                    const answer = direction === 'korToEng' ? w.eng : w.kor
                    const isCorrect = results[w.id]
                    const showResult = mode === 'result'

                    return (
                        <div key={w.id} className={`test-row ${showResult ? (isCorrect ? 'correct-row' : 'incorrect-row') : ''} ${isLargeList ? 'compact' : ''}`}>
                            <div className="question-col">
                                <span className="q-text">{question}</span>
                            </div>

                            <div className="answer-col">
                                {showResult ? (
                                    <div className="result-display">
                                        <span className={`user-input ${isCorrect ? 'correct' : 'incorrect'}`}>
                                            {inputs[w.id]}
                                        </span>
                                        {!isCorrect && (
                                            <span className="correct-answer">
                                                {answer}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="input-with-hint">
                                        <input
                                            id={`test-input-${index}`}
                                            ref={index === 0 ? firstInputRef : null}
                                            type="text"
                                            className="input-field"
                                            value={inputs[w.id] || ''}
                                            onChange={(e) => setInputs({ ...inputs, [w.id]: e.target.value })}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            placeholder="정답 입력"
                                            autoComplete="off"
                                        />
                                        {allowHint && (
                                            <div className="hint-wrapper">
                                                <button
                                                    className="btn-hint"
                                                    onClick={() => toggleHint(w.id)}
                                                    tabIndex={-1}
                                                    title="힌트 보기"
                                                >
                                                    <span className="hint-icon">?</span>
                                                </button>
                                                {hints[w.id] && (
                                                    <div className="hint-tooltip">
                                                        {answer}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="actions-footer">
                <button className="btn-secondary" onClick={handleEarlyExitClick} style={{ marginRight: 'auto' }}>
                    조기 종료
                </button>
                {mode === 'input' ? (
                    <button className="btn-primary" onClick={handleCheck}>정답 확인</button>
                ) : (
                    <button className="btn-primary" onClick={onComplete}>다음 단계</button>
                )}
            </div>
        </div>
    )
}

function SummaryStage({ words, onRestart }) {
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [folders, setFolders] = useState([])
    const [selectedFolderId, setSelectedFolderId] = useState('')
    const [newFolderName, setNewFolderName] = useState('')

    useEffect(() => {
        if (showSaveDialog) {
            const saved = localStorage.getItem('myWordbook')
            if (saved) {
                const parsed = JSON.parse(saved)
                setFolders(parsed)
                if (parsed.length > 0) setSelectedFolderId(parsed[0].id)
            } else {
                setFolders([])
            }
        }
    }, [showSaveDialog])

    const handleSaveToFolder = () => {
        let targetId = selectedFolderId
        let currentFolders = [...folders]

        if (!targetId || targetId === 'new') {
            if (!newFolderName.trim()) {
                if (targetId === 'new' || !targetId) {
                    alert('새 단어장 이름을 입력해주세요.')
                    return
                }
            } else {
                const newFolder = {
                    id: Date.now().toString(),
                    name: newFolderName,
                    words: []
                }
                currentFolders.push(newFolder)
                targetId = newFolder.id
            }
        }

        if (!targetId) return

        const updatedFolders = currentFolders.map(f => {
            if (f.id === targetId) {
                const newWords = words.map(w => ({ ...w, id: Date.now() + Math.random().toString() }))
                return { ...f, words: [...f.words, ...newWords] }
            }
            return f
        })

        // Edge case: if we created a new folder but didn't map it properly because it was pushed
        // Actually since we pushed to currentFolders, and map iterates currentFolders, if we pushed BEFORE mapping, it should be fine?
        // Wait, map returns a new array. Yes.

        // Double check for new folder existence since map might not catch the pushed item if it was pushed to the array reference?
        // Ah, `currentFolders.push` modifies in place. `currentFolders.map` iterates the modified array.
        // So `updatedFolders` will include the new folder.
        // But the new folder needs words added.
        // If it's a new folder, it has empty words initially. The map loop will see it (id matches targetId) and add words.
        // Logic seems correct.

        localStorage.setItem('myWordbook', JSON.stringify(updatedFolders))
        alert('단어장에 저장되었습니다!')
        setShowSaveDialog(false)
    }

    return (
        <div className="card summary-view">
            <h2>🎉 학습 완료! 🎉</h2>
            <p>모든 단어 학습을 마쳤습니다. 수고하셨습니다.</p>

            <div className="summary-list">
                <h3>학습한 단어</h3>
                <ul>
                    {words.map((w, i) => (
                        <li key={i}>
                            <span className="eng">{w.eng}</span>
                            <span className="divider"> - </span>
                            <span className="kor">{w.kor}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="actions-row center-align" style={{ gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setShowSaveDialog(true)}>
                    단어장에 저장하기
                </button>
                <button className="btn-primary" onClick={onRestart} autoFocus>
                    새로운 단어 학습하기
                </button>
            </div>

            {showSaveDialog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ marginTop: 0 }}>단어장 선택</h3>
                        <div className="form-group-vertical">
                            <select
                                className="select-field"
                                value={selectedFolderId}
                                onChange={(e) => {
                                    setSelectedFolderId(e.target.value)
                                }}
                                style={{ width: '100%' }}
                            >
                                {folders.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                                <option value="new">+ 새 단어장 만들기</option>
                            </select>

                            {(folders.length === 0 || selectedFolderId === 'new') && (
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="새 단어장 이름 입력"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    style={{ width: '90%' }}
                                />
                            )}

                            <div className="actions-row" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button className="btn-secondary" onClick={() => setShowSaveDialog(false)} style={{ marginRight: '0.5rem' }}>취소</button>
                                <button className="btn-primary" onClick={handleSaveToFolder}>저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
