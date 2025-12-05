import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Today from './pages/Today';
import Calendar from './pages/Calendar';
import SpecialDays from './pages/SpecialDays';
import Settings from './pages/Settings';
import QuickSetup from './pages/QuickSetup';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/special-days" element={<SpecialDays />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/quick-setup" element={<QuickSetup />} />
      </Routes>
    </Layout>
  );
}

export default App;

