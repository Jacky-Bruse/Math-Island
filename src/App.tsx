import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ArithmeticSelectPage from './pages/ArithmeticSelectPage'
import ArithmeticTrainingPage from './pages/ArithmeticTrainingPage'
import ComparisonTrainingPage from './pages/ComparisonTrainingPage'
import SudokuSelectPage from './pages/SudokuSelectPage'
import SudokuTrainingPage from './pages/SudokuTrainingPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/arithmetic" element={<ArithmeticSelectPage />} />
      <Route path="/arithmetic/:range" element={<ArithmeticTrainingPage />} />
      <Route path="/comparison" element={<ComparisonTrainingPage />} />
      <Route path="/sudoku" element={<SudokuSelectPage />} />
      <Route path="/sudoku/:size" element={<SudokuTrainingPage />} />
    </Routes>
  )
}
