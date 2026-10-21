import MeetingList from './components/MeetingList.jsx';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Система управления собраниями и встречами</h1>
        <p className="app-subtitle">Лабораторная работа №4 — управление состоянием в React</p>
      </header>
      <main className="app-main">
        <MeetingList />
      </main>
    </div>
  );
}
