import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ArithmeticSelectPage from './pages/ArithmeticSelectPage'
import AddSubtractSelectPage from './pages/AddSubtractSelectPage'
import ArithmeticTrainingPage from './pages/ArithmeticTrainingPage'
import ComparisonTrainingPage from './pages/ComparisonTrainingPage'
import MultiplicationTablePage from './pages/MultiplicationTablePage'
import MultiplicationUnderstandPage from './pages/MultiplicationUnderstandPage'
import MultiplicationPracticeSelectPage from './pages/MultiplicationPracticeSelectPage'
import MultiplicationPracticePage from './pages/MultiplicationPracticePage'
import SudokuSelectPage from './pages/SudokuSelectPage'
import SudokuTrainingPage from './pages/SudokuTrainingPage'
import PoemListPage from './pages/PoemListPage'
import PoemReadPage from './pages/PoemReadPage'
import PoemEditorPage from './pages/PoemEditorPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/arithmetic" element={<ArithmeticSelectPage />} />
      <Route path="/arithmetic/add-subtract" element={<AddSubtractSelectPage />} />
      <Route path="/arithmetic/add-subtract/:range" element={<ArithmeticTrainingPage />} />
      <Route path="/arithmetic/multiplication" element={<MultiplicationTablePage />} />
      <Route path="/arithmetic/multiplication/understand/:a/:b" element={<MultiplicationUnderstandPage />} />
      <Route path="/arithmetic/multiplication/practice" element={<MultiplicationPracticeSelectPage />} />
      <Route path="/arithmetic/multiplication/practice/:level" element={<MultiplicationPracticePage />} />
      <Route path="/arithmetic/:range" element={<ArithmeticTrainingPage />} />
      <Route path="/comparison" element={<ComparisonTrainingPage />} />
      <Route path="/sudoku" element={<SudokuSelectPage />} />
      <Route path="/sudoku/:size" element={<SudokuTrainingPage />} />
      <Route path="/poems" element={<PoemListPage />} />
      <Route path="/poems/edit" element={<PoemEditorPage />} />
      <Route path="/poems/edit/:id" element={<PoemEditorPage />} />
      <Route path="/poems/:id" element={<PoemReadPage />} />
    </Routes>
  )
}
