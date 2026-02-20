import { useState, useEffect, useRef } from 'react'
import '../App.css' // Recycle existing styles

export default function MyWordbook({ isMaximized, onStartFiveStep }) {
    // Data structure: { id, name, parentId, color, words: [{ id, eng, kor, date }] }
    const [folders, setFolders] = useState([])
    const [activeFolderId, setActiveFolderId] = useState(null) // For viewing words
    const [currentFolderId, setCurrentFolderId] = useState(null) // For navigation (Group level)
    const [newFolderName, setNewFolderName] = useState('')
    const [newFolderColor, setNewFolderColor] = useState('#FFD700') // Default yellow
    const [isCreating, setIsCreating] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const API_URL = 'http://localhost:3000/folders'

    // Helper: Folder Colors
    const folderColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#D4A5A5', '#9E9E9E']

    // Load from API on mount
    const fetchFolders = async () => {
        try {
            const res = await fetch(API_URL)
            if (!res.ok) throw new Error('Failed to fetch')
            let data = await res.json()

            // Migration/Cleanup: Ensure structure and clean root words
            // Note: We can't easily bulk update via standard json-server without multiple requests, 
            // so we'll just fix the local state for display and let individual updates fix the DB over time if needed.
            // OR we could fix them one by one. For now, let's just display correctly.
            data = data.map((f, index) => ({
                ...f,
                parentId: f.parentId || null,
                color: f.color || '#FFD700',
                words: (!f.parentId) ? [] : (f.words || []), // Force clear words for root folders locally
                order: (f.order !== undefined) ? f.order : index * 100 // Initialize order if missing
            }))

            setFolders(data)
        } catch (e) {
            console.error("Error fetching folders:", e)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFolders()
    }, [])

    const createFolder = async () => {
        if (!newFolderName.trim()) return

        // Calculate next order
        const siblings = folders.filter(f => f.parentId === currentFolderId)
        const maxOrder = siblings.reduce((max, f) => Math.max(max, f.order || 0), 0)

        const newFolder = {
            id: Date.now().toString(),
            name: newFolderName,
            parentId: currentFolderId,
            color: newFolderColor,
            words: [],
            order: maxOrder + 100 // Add to end
        }

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFolder)
            })
            if (res.ok) {
                setFolders(prev => [...prev, newFolder])
                setNewFolderName('')
                setNewFolderColor('#FFD700')
                setIsCreating(false)
            }
        } catch (e) {
            alert('폴더 생성 실패: ' + e.message)
        }
    }

    const deleteFolder = async (id) => {
        if (!window.confirm('정말 이 단어장(과 포함된 하위 폴더)을 삭제하시겠습니까?')) return

        // 1. Identify all folders to delete (Self + Children)
        const idsToDelete = new Set([id])
        folders.forEach(f => {
            if (f.parentId === id) idsToDelete.add(f.id)
        })

        // 2. Optimistic Update (Update UI immediately)
        const previousFolders = [...folders]
        setFolders(prev => prev.filter(f => !idsToDelete.has(f.id)))
        if (activeFolderId === id) setActiveFolderId(null)
        if (currentFolderId === id) setCurrentFolderId(null)

        // 3. Perform API Deletes
        try {
            await Promise.all([...idsToDelete].map(folderId =>
                fetch(`${API_URL}/${folderId}`, { method: 'DELETE' })
            ))
        } catch (e) {
            console.error("Delete failed", e)
            alert('삭제 중 오류가 발생했습니다.')
            setFolders(previousFolders) // Revert on error
        }
    }

    const deleteWord = async (folderId, wordId) => {
        // Optimistic Update
        const targetFolder = folders.find(f => f.id === folderId)
        if (!targetFolder) return

        const updatedWords = targetFolder.words.filter(w => w.id !== wordId)
        const updatedFolder = { ...targetFolder, words: updatedWords }

        setFolders(prev => prev.map(f => f.id === folderId ? updatedFolder : f))

        try {
            await fetch(`${API_URL}/${folderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words: updatedWords })
            })
        } catch (e) {
            console.error("Update failed", e)
            // Revert logic would go here if strict
        }
    }

    const activeFolder = folders.find(f => f.id === activeFolderId)

    // Filter folders for current view and sort
    const visibleFolders = folders
        .filter(f => f.parentId === currentFolderId)
        .sort((a, b) => (a.order || 0) - (b.order || 0))

    const currentFolder = folders.find(f => f.id === currentFolderId)

    // DnD Logic
    const dragItem = useRef(null)
    const dragOverItem = useRef(null)

    const handleDragStart = (e, position) => {
        dragItem.current = position
    }

    const handleDragEnter = (e, position) => {
        dragOverItem.current = position
    }

    const handleSort = async () => {
        if (dragItem.current === null || dragOverItem.current === null) return

        // Clone visible folders to reorder locally
        const _visibleFolders = [...visibleFolders]
        const draggedItemContent = _visibleFolders[dragItem.current]

        // Remove and Insert
        _visibleFolders.splice(dragItem.current, 1)
        _visibleFolders.splice(dragOverItem.current, 0, draggedItemContent)

        // Calculate new orders
        // Reset refs
        dragItem.current = null
        dragOverItem.current = null

        // Apply new order values based on index * 100
        const updates = _visibleFolders.map((f, index) => ({
            ...f,
            order: index * 100
        }))

        // Optimistic Update Global State
        const updatedIds = new Set(updates.map(u => u.id))
        setFolders(prev => prev.map(f => {
            if (updatedIds.has(f.id)) {
                return updates.find(u => u.id === f.id)
            }
            return f
        }))

        // Verify visually
        // API Updates
        try {
            await Promise.all(updates.map(f =>
                fetch(`${API_URL}/${f.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order: f.order })
                })
            ))
        } catch (e) {
            console.error("Reorder failed", e)
        }
    }

    // Test Mode State
    const [testMode, setTestMode] = useState('none') // 'none', 'testing', 'result'
    const [testWords, setTestWords] = useState([])
    const [userAnswers, setUserAnswers] = useState({})
    const [testResult, setTestResult] = useState(null)

    // Selection & Edit State
    const [selectedWordIds, setSelectedWordIds] = useState(new Set())
    const [editingWordId, setEditingWordId] = useState(null)
    const [editEng, setEditEng] = useState('')
    const [editKor, setEditKor] = useState('')

    // Reset selection when changing folders
    useEffect(() => {
        setSelectedWordIds(new Set())
        setEditingWordId(null)
    }, [activeFolderId])

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

    // Edit Functions
    const startEditing = (word) => {
        setEditingWordId(word.id)
        setEditEng(word.eng)
        setEditKor(word.kor)
    }

    const cancelEditing = () => {
        setEditingWordId(null)
        setEditEng('')
        setEditKor('')
    }

    const saveEdit = async (folderId, wordId) => {
        if (!editEng.trim() || !editKor.trim()) {
            alert('단어와 뜻을 모두 입력해주세요.')
            return
        }

        const targetFolder = folders.find(f => f.id === folderId)
        if (!targetFolder) return

        const updatedWords = targetFolder.words.map(w => {
            if (w.id === wordId) {
                return { ...w, eng: editEng.trim(), kor: editKor.trim() }
            }
            return w
        })

        // Optimistic Update
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, words: updatedWords } : f))
        setEditingWordId(null)

        try {
            await fetch(`${API_URL}/${folderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words: updatedWords })
            })
        } catch (e) {
            console.error("Save edit failed", e)
        }
    }

    // Selection Functions
    const toggleSelect = (id) => {
        const newSet = new Set(selectedWordIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedWordIds(newSet)
    }

    const toggleSelectAll = () => {
        if (!activeFolder) return
        if (selectedWordIds.size === activeFolder.words.length) {
            setSelectedWordIds(new Set())
        } else {
            const allIds = new Set(activeFolder.words.map(w => w.id))
            setSelectedWordIds(allIds)
        }
    }

    const handleStartFiveStepClick = () => {
        if (selectedWordIds.size === 0) {
            alert('학습할 단어를 선택해주세요.')
            return
        }
        const selectedWords = activeFolder.words.filter(w => selectedWordIds.has(w.id))
        onStartFiveStep(selectedWords)
    }

    return (
        <div className="container">
            {!isMaximized && (
                <header className="header">
                    <h1>나만의 단어장</h1>
                    <p className="subtitle">저장한 단어를 복습하고 관리하세요.</p>
                </header>
            )}

            {!activeFolderId || !activeFolder ? (
                // Folder List View
                <div className="folder-list-view">
                    <div className="actions-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {currentFolderId && (
                                <button
                                    className="btn-secondary"
                                    onClick={() => setCurrentFolderId(null)}
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                                >
                                    ← 뒤로
                                </button>
                            )}
                            <h2 style={{ margin: 0 }}>
                                {currentFolder ? currentFolder.name : '단어장 목록'}
                            </h2>
                        </div>
                        <button
                            className="btn-primary"
                            onClick={() => setIsCreating(true)}
                            disabled={isCreating}
                        >
                            + 새 {currentFolderId ? '단어장' : '그룹/폴더'}
                        </button>
                    </div>

                    {isCreating && (
                        <div className="card create-folder-form">
                            <div className="form-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder={currentFolderId ? "단어장 이름" : "폴더 이름"}
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && createFolder()}
                                    style={{ width: '100%' }}
                                />
                                <div className="color-picker" style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
                                    {folderColors.map(c => (
                                        <div
                                            key={c}
                                            onClick={() => setNewFolderColor(c)}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: c,
                                                cursor: 'pointer',
                                                border: newFolderColor === c ? '2px solid #333' : '1px solid #ddd',
                                                transform: newFolderColor === c ? 'scale(1.1)' : 'scale(1)'
                                            }}
                                        />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn-primary" onClick={createFolder}>확인</button>
                                    <button className="btn-secondary" onClick={() => setIsCreating(false)}>취소</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="folder-grid">
                        {visibleFolders.map((folder, index) => {
                            const subFolderCount = folders.filter(f => f.parentId === folder.id).length
                            return (
                                <div
                                    key={folder.id}
                                    className="card folder-card compact"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragEnd={handleSort}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => {
                                        if (currentFolderId === null) {
                                            // Level 1 -> Enter Folder
                                            setCurrentFolderId(folder.id)
                                        } else {
                                            // Level 2 -> Open Words
                                            setActiveFolderId(folder.id)
                                        }
                                    }}
                                >
                                    <div className="folder-icon" style={{ color: folder.color || '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" />
                                        </svg>
                                    </div>
                                    <div className="folder-info-line">
                                        <span className="folder-name">{folder.name}</span>
                                        <span className="folder-count">
                                            {currentFolderId === null
                                                ? `(${subFolderCount}개 폴더)`
                                                : `(${folder.words.length}개 단어)`
                                            }
                                        </span>
                                    </div>
                                    <button
                                        className="btn-delete-folder"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteFolder(folder.id)
                                        }}
                                        title="삭제"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                // Word List View
                // Word List View or Test View
                <div className="word-list-view">
                    <div className="actions-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={() => setActiveFolderId(null)}>← 목록으로</button>
                        <h2 style={{ margin: '0 1rem' }}>{activeFolder.name}</h2>

                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                            {testMode === 'none' && activeFolder.words.length > 0 && (
                                <>
                                    <button
                                        className="btn-primary"
                                        onClick={handleStartFiveStepClick}
                                        disabled={selectedWordIds.size === 0}
                                        title="선택한 단어를 5단계 암기 학습으로 보냅니다"
                                    >
                                        🧠 선택 단어 암기 ({selectedWordIds.size})
                                    </button>
                                    <button className="btn-primary" onClick={startTest}>
                                        📝 테스트 시작
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {testMode === 'none' && (
                        <div className="card">
                            {activeFolder.words.length === 0 ? (
                                <p className="empty-state">저장된 단어가 없습니다.</p>
                            ) : (
                                <>
                                    <div className="list-header" style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedWordIds.size === activeFolder.words.length && activeFolder.words.length > 0}
                                                onChange={toggleSelectAll}
                                                style={{ marginRight: '8px' }}
                                            />
                                            전체 선택 ({activeFolder.words.length})
                                        </label>
                                    </div>
                                    <ul className="word-list">
                                        {activeFolder.words.map(word => (
                                            <li key={word.id} className="word-item" style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem' }}>
                                                {editingWordId === word.id ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                                                        <input
                                                            type="text"
                                                            value={editEng}
                                                            onChange={e => setEditEng(e.target.value)}
                                                            className="input-field"
                                                            placeholder="영어"
                                                            style={{ flex: 1 }}
                                                            autoFocus
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editKor}
                                                            onChange={e => setEditKor(e.target.value)}
                                                            className="input-field"
                                                            placeholder="한글"
                                                            style={{ flex: 1 }}
                                                        />
                                                        <button className="btn-primary btn-sm" onClick={() => saveEdit(activeFolder.id, word.id)}>저장</button>
                                                        <button className="btn-secondary btn-sm" onClick={cancelEditing}>취소</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedWordIds.has(word.id)}
                                                            onChange={() => toggleSelect(word.id)}
                                                            style={{ marginRight: '1rem' }}
                                                        />
                                                        <div className="word-text" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                                            <span className="eng" style={{ fontWeight: 'bold', marginRight: '10px', minWidth: '100px' }}>{word.eng}</span>
                                                            <span className="kor" style={{ color: '#64748b' }}>{word.kor}</span>
                                                        </div>
                                                        <div className="item-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                className="btn-edit"
                                                                onClick={() => startEditing(word)}
                                                                title="수정"
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                className="btn-delete"
                                                                onClick={() => deleteWord(activeFolder.id, word.id)}
                                                                title="삭제"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}

                    {testMode === 'testing' && (
                        <div className="card test-container">
                            <h3>단어 테스트</h3>
                            <p className="subtitle">한글 뜻을 입력하세요.</p>
                            <div className="test-list">
                                {testWords.map((word, index) => (
                                    <div key={word.id} className="test-item" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
