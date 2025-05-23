import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCurrentToDoList } from '../components/hooks/ToDoList';

/**
 * 検索機能を管理するContext
 * 
 * @description アプリケーション全体で検索状態を共有し、
 *              Todoアイテムの検索・フィルタリング機能を提供
 * @author システム開発者
 * @version 1.0
 */
const SearchContext = createContext();

/**
 * 検索Contextプロバイダーコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 * @returns {JSX.Element} SearchContextプロバイダー
 */
export const SearchProvider = ({ children }) => {
    // 検索状態の管理
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchMode, setSearchMode] = useState(false); // 検索モードのON/OFF
    
    // Todoリストの取得
    const todoList = useCurrentToDoList();

    /**
     * Todoアイテムを検索する関数
     * 
     * @param {string} query - 検索クエリ
     * @param {Array} todos - 検索対象のTodoリスト
     * @returns {Array} 検索結果のTodoリスト
     */
    const searchTodos = (query, todos) => {
        if (!query || !todos) return [];
        
        const lowercaseQuery = query.toLowerCase();
        
        return todos.filter(todo => {
            // Todoタイトルでの検索
            const titleMatch = todo.title?.toLowerCase().includes(lowercaseQuery);
            
            // Todo詳細での検索（todo_detailsがある場合）
            const detailsMatch = todo.todo_details?.some(detail => 
                detail.description?.toLowerCase().includes(lowercaseQuery)
            );
            
            return titleMatch || detailsMatch;
        });
    };

    /**
     * 検索実行関数
     * 
     * @param {string} query - 検索クエリ
     */
    const performSearch = (query) => {
        setIsSearching(true);
        setSearchQuery(query);
        
        if (!query.trim()) {
            setSearchResults([]);
            setSearchMode(false);
            setIsSearching(false);
            return;
        }
        
        setSearchMode(true);
        
        // 検索実行（デバウンス処理）
        const timeoutId = setTimeout(() => {
            const results = searchTodos(query, todoList);
            setSearchResults(results);
            setIsSearching(false);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    };

    /**
     * 検索クリア関数
     */
    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchMode(false);
        setIsSearching(false);
    };

    /**
     * 検索結果のハイライト用関数
     * 
     * @param {string} text - ハイライト対象のテキスト
     * @param {string} query - 検索クエリ
     * @returns {string} ハイライト処理されたテキスト
     */
    const highlightSearchTerm = (text, query) => {
        if (!query || !text) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    };

    // 検索クエリが変更された時の処理
    useEffect(() => {
        if (searchQuery) {
            const cleanup = performSearch(searchQuery);
            return cleanup;
        } else {
            clearSearch();
        }
    }, [searchQuery, todoList]);

    // Context値の定義
    const contextValue = {
        // 検索状態
        searchQuery,
        searchResults,
        isSearching,
        searchMode,
        
        // 検索関数
        setSearchQuery,
        performSearch,
        clearSearch,
        highlightSearchTerm,
        
        // 検索統計
        totalResults: searchResults.length,
        hasResults: searchResults.length > 0,
    };

    return (
        <SearchContext.Provider value={contextValue}>
            {children}
        </SearchContext.Provider>
    );
};

/**
 * 検索Contextを使用するためのカスタムHook
 * 
 * @returns {Object} 検索関連の状態と関数
 * @throws {Error} SearchProvider外で使用された場合
 */
export const useSearch = () => {
    const context = useContext(SearchContext);
    
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    
    return context;
};

export default SearchContext; 