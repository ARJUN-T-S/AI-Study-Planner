
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import Home from './Pages/Home';
import Login from './Pages/Login';

function App() {
 

  return (
   <div>
   
      <BrowserRouter>
      <Routes>
        <Route index element={<Home/>}/>
        <Route path="/home" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
      </Routes>
      </BrowserRouter>
     
    </div>

  )
}

export default App
