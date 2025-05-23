import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCurrentToDoList } from '../components/hooks/ToDoList';

/**
 * 検索機能を管理するContext
 * 
 * @description アプリケーション全体で検索状態を共有し、
 *              Todoアイテムの検索・フィルタリング機能を提供
 *              検索結果に詳細な一致情報を含める
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
    const [searchStats, setSearchStats] = useState({
        totalTodos: 0,
        titleMatches: 0,
        detailMatches: 0,
        totalDetailMatches: 0
    });
    
    // Todoリストの取得
    const todoList = useCurrentToDoList();

    /**
     * Todoアイテムを検索する関数
     * 
     * @param {string} query - 検索クエリ
     * @param {Array} todos - 検索対象のTodoリスト
     * @returns {Object} 検索結果とその統計情報
     */
    const searchTodos = (query, todos) => {
        if (!query || !todos) {
            return {
                results: [],
                stats: {
                    totalTodos: 0,
                    titleMatches: 0,
                    detailMatches: 0,
                    totalDetailMatches: 0
                }
            };
        }
        
        const lowercaseQuery = query.toLowerCase();
        const results = [];
        let titleMatches = 0;
        let detailMatches = 0;
        let totalDetailMatches = 0;
        
        todos.forEach(todo => {
            // Todoタイトルでの検索
            const titleMatch = todo.title?.toLowerCase().includes(lowercaseQuery);
            
            // Todo詳細での検索（todo_detailsがある場合）
            const matchingDetails = todo.todo_details?.filter(detail => 
                detail.description?.toLowerCase().includes(lowercaseQuery)
            ) || [];
            
            const hasDetailMatch = matchingDetails.length > 0;
            
            // タイトルまたは詳細のいずれかに一致する場合、結果に含める
            if (titleMatch || hasDetailMatch) {
                results.push({
                    ...todo,
                    searchMeta: {
                        titleMatch,
                        detailMatch: hasDetailMatch,
                        matchingDetailsCount: matchingDetails.length,
                        matchingDetails
                    }
                });
                
                if (titleMatch) titleMatches++;
                if (hasDetailMatch) {
                    detailMatches++;
                    totalDetailMatches += matchingDetails.length;
                }
            }
        });
        
        return {
            results,
            stats: {
                totalTodos: results.length,
                titleMatches,
                detailMatches,
                totalDetailMatches
            }
        };
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
            setSearchStats({
                totalTodos: 0,
                titleMatches: 0,
                detailMatches: 0,
                totalDetailMatches: 0
            });
            setSearchMode(false);
            setIsSearching(false);
            return;
        }
        
        setSearchMode(true);
        
        // 検索実行（デバウンス処理）
        const timeoutId = setTimeout(() => {
            const searchResult = searchTodos(query, todoList);
            setSearchResults(searchResult.results);
            setSearchStats(searchResult.stats);
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
        setSearchStats({
            totalTodos: 0,
            titleMatches: 0,
            detailMatches: 0,
            totalDetailMatches: 0
        });
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
        searchStats,
        
        // 検索関数
        setSearchQuery,
        performSearch,
        clearSearch,
        highlightSearchTerm,
        
        // 検索統計（後方互換性のため）
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