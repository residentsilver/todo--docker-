import React from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

/**
 * ナビゲーションバーコンポーネント
 * 
 * @description アプリケーションのメインナビゲーションを提供
 *              削除されたTodoページへのリンクも含む
 */
class Navbar extends React.Component {
  render(){
    return(
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <Link to="/" className="brand-link">Todo App</Link>
          </div>
          <div className="navbar-links">
            <Link to="/" className="nav-link">🏠 ホーム</Link>
            <Link to="/todo" className="nav-link">📝 Todo管理</Link>
            <Link to="/aiTodo" className="nav-link">🤖 AI Todo</Link>
            <Link to="/todo-deleted" className="nav-link deleted-link">🗑️ 削除済み</Link>
          </div>
        </div>
      </nav>
    )
  }
}

export default Navbar;
