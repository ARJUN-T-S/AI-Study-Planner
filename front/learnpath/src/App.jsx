
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import Home from './Pages/Home';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import StudySchedule from './Pages/StudySchedule';

function App() {
 

  return (
   <div>
   
      <BrowserRouter>
      <Routes>
        <Route index element={<Home/>}/>
        <Route path="/home" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/studyschedule" element={<StudySchedule/>}/>
      </Routes>
      </BrowserRouter>
     
    </div>

  )
}

export default App
