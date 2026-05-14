import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx'
import Videos from './pages/Video.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/videos" element={<Videos />} />
    </Routes>
  );
}
