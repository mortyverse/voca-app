# Vocabulary App (voca) PRD

## 1. Project Overview

**Voca** is a React-based vocabulary learning application designed to help users master English vocabulary through specialized practice modes and a rigorous 5-step repetition study method. 

The application focuses on three main areas of English vocabulary mastery:
1. Distinguishing between Countable and Uncountable nouns.
2. Associating Person nouns with their corresponding Object/Abstract nouns.
3. General vocabulary memorization through a structured 5-step repetition process.

## 2. Goals & Objectives

- **Specialized Learning**: Target specific grammatical challenges (Countability, Person vs. Object).
- **Repetition Mastery**: Utilize a multi-stage testing process to enforce long-term memory retention.
- **User Customization**: Allow users to manage their own vocabulary lists and folders.
- **Engagement**: Provide immediate feedback, progress tracking, and visual rewards (confetti) to keep users motivated.

## 3. Core Features

### 3.1. Countable vs. Uncountable Nouns (`CountableApp`)
*Addresses the difficulty of distinguishing between countable and uncountable nouns.*

- **Add Words**: Users can input English words and classify them as 'Countable' or 'Uncountable'.
- **Practice Mode**:
  - Randomly presents words.
  - User guesses the classification.
  - Tracks current streak of correct answers.
- **Test Mode**:
  - A comprehensive test of all words in the list.
  - Users submit answers for the entire set.
  - Provides a final score and detailed review of correct/incorrect answers.

### 3.2. Person vs. Object/Abstract Nouns (`PersonObjectApp`)
*Helps users link related nouns (e.g., Artist ↔ Art).*

- **Add Pairs**: Users input pairs of related words (Person Noun ↔ Object/Abstract Noun).
- **Quiz Mode**:
  - Randomly presents one side of the pair (e.g., "Artist").
  - User must input the corresponding noun (e.g., "Art").
  - Works bi-directionally (Person → Object and Object → Person).
- **Test Mode**:
  - Full test of all pairs with scoring.

### 3.3. 5-Step Study Method (`FiveStepStudyApp`)
*A rigorous memorization process for general vocabulary.*

- **Input Stage (Step 1)**:
  - Users manually input a list of English words and Korean meanings.
  - Supports importing selected words from "My Wordbook".
- **Study Configuration**:
  - **Mode Selection**: 'Easy' (Sequential order) vs. 'Hard' (Randomized order).
  - **Target Stage**: Users can choose to complete up to 5 stages.
- **Study Process (Steps 2-9)**:
  - Consists of alternating test types (Korean → English, English → Korean).
  - **Hints**: Available in early stages (1-5), removed in later stages (6-9) for difficulty.
- **Summary (Step 10)**:
  - Review all learned words.
  - Option to save successful words to "My Wordbook".
  - Confetti celebration upon completion.

### 3.4. My Wordbook (`MyWordbook`)
*Personalized vocabulary management.*

- **Folder System**: Create, delete, and manage named folders for organizing words.
- **Word Management**: Add, edit, and delete words within folders.
- **Integration**: Select specific words to transfer to the **5-Step Study** app for intensive practice.
- **Internal Test**: A self-contained test mode within the wordbook to check memory of stored words.

### 3.5. General Features
- **Focus Mode**: A "Maximize" button to expand the app to full screen, minimizing distractions.
- **Data Persistence**:
  - **JSON Server**: Used for `CountableApp` and `PersonObjectApp` data.
  - **LocalStorage**: Used for `MyWordbook` data.

## 4. User Flows

### A. Learning a New Set of Words
1. User enters **5-Step Study** app.
2. User inputs words or imports from **My Wordbook**.
3. User selects "Hard Mode" and "5 Stages".
4. User completes alternating translation tests.
5. Upon completion, user saves mastered words to a "Completed" folder in **My Wordbook**.

### B. Practicing Grammar (Countable/Uncountable)
1. User enters **Countable/Uncountable Noun** app.
2. User adds tricky words (e.g., "Information", "Furniture").
3. User enters **Practice Mode** to test their knowledge rapidly.
4. User takes a full **Test** to verify mastery.

## 5. Technology Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Language**: JavaScript (JSX)
- **Styling**: Vanilla CSS (`App.css`)
- **Backend (Mock)**: JSON Server (watching `db.json`)
- **State Management**: React `useState`, `useEffect`, `useRef`
- **Utilities**:
  - `canvas-confetti`: Visual effects.
  - `concurrently`: Running frontend and backend simultaneously.
- **Deployment/Run**: `npm run dev` (starts both Vite and JSON Server).

## 6. Data Structure

### JSON Server (`db.json`)
Used for shared/persistent app data.

```json
{
  "words": [
    { "id": "1", "word": "apple", "type": "countable" },
    { "id": "2", "word": "water", "type": "uncountable" }
  ],
  "pairs": [
    { "id": "1", "person": "Artist", "object": "Art" }
  ]
}
```

### LocalStorage (`myWordbook`)
Used for personal wordbook data.

```json
[
  {
    "id": "folder_id",
    "name": "Folder Name",
    "words": [
      { "id": "word_id", "eng": "Apple", "kor": "사과", "date": "..." }
    ]
  }
]
```

## 7. Future Enhancements (Proposed)

- **Unified Database**: Migrate `MyWordbook` to JSON Server for consistent data handling.
- **Authentication**: Multi-user support to allow different family members to have their own wordbooks.
- **Mobile Optimization**: Improve touch targets and layout for mobile usage.
- **TTS (Text-to-Speech)**: Add audio pronunciation for English words.
