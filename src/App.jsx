import { useState } from 'react'
import './App.css'
import NavBar from './components/NavBar'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from './pages/Home';
import ResumeScan from './pages/ResumeScan';
import GenerateJD from './pages/GenerateJD';
import UploadResumes from './pages/UploadResumes';
function App() {

  return (
      <Router>
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <div>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan" element={<ResumeScan />} />
              <Route path="/job-creation" element={<GenerateJD />} />
              <Route path="/bulk-upload" element={<UploadResumes />} />
            </Routes>
          </div>
        </div>
      </Router>
  )
}

export default App
