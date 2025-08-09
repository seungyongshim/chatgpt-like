// IndexedDB를 사용한 채팅 데이터 저장소
class ChatStorage {
    constructor() {
        this.dbName = 'ChatAppDB';
        this.version = 1;
        this.db = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized && this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            console.log('Initializing IndexedDB...');
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                console.error('IndexedDB open error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                console.log('IndexedDB opened successfully');
                this.db = request.result;
                this.isInitialized = true;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('IndexedDB upgrade needed, creating object stores...');
                const db = event.target.result;
                
                // 세션 스토어 생성
                if (!db.objectStoreNames.contains('sessions')) {
                    console.log('Creating sessions object store...');
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionStore.createIndex('title', 'title', { unique: false });
                    sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                // 설정 스토어 생성
                if (!db.objectStoreNames.contains('settings')) {
                    console.log('Creating settings object store...');
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                console.log('IndexedDB upgrade completed');
            };
        });
    }

    async saveSessions(sessions) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        
        // 기존 세션들 삭제
        await new Promise((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
        });
        
        // 새 세션들 저장
        for (const session of sessions) {
            // C#의 대문자 속성명을 JavaScript 소문자로 변환
            const sessionData = {
                id: session.Id || session.id,
                title: session.Title || session.title,
                history: session.History || session.history,
                createdAt: new Date().toISOString()
            };
            console.log('Saving session to IndexedDB:', sessionData);
            
            // 유효성 검사
            if (!sessionData.id) {
                console.error('Invalid session data: missing id', session);
                throw new Error('Session must have a valid id');
            }
            
            await new Promise((resolve, reject) => {
                const request = store.add(sessionData);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log('Sessions saved to IndexedDB successfully');
                resolve();
            };
            transaction.onerror = () => {
                console.error('Error saving sessions to IndexedDB:', transaction.error);
                reject(transaction.error);
            };
        });
    }

    async loadSessions() {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['sessions'], 'readonly');
        const store = transaction.objectStore('sessions');
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const sessions = request.result.map(session => ({
                    Id: session.id,
                    Title: session.title,
                    History: session.history
                }));
                console.log('Loaded sessions from IndexedDB:', sessions);
                resolve(sessions);
            };
            request.onerror = () => {
                console.error('Error loading sessions from IndexedDB:', request.error);
                reject(request.error);
            };
        });
    }

    async saveSetting(key, value) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        
        await store.put({ key, value });
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async loadSetting(key) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get(key);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// 전역 인스턴스 생성
window.chatStorage = new ChatStorage();

// 초기화 함수
window.initializeIndexedDB = async () => {
    try {
        await window.chatStorage.init();
        console.log('IndexedDB initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        return false;
    }
};

// .NET에서 호출할 수 있는 함수들
window.saveSessionsToIndexedDB = async (sessions) => {
    try {
        console.log('saveSessionsToIndexedDB called with:', sessions);
        const result = await window.chatStorage.saveSessions(sessions);
        console.log('saveSessionsToIndexedDB result:', result);
        return true;
    } catch (error) {
        console.error('Error saving sessions to IndexedDB:', error);
        throw error; // Re-throw to let .NET handle the fallback
    }
};

window.loadSessionsFromIndexedDB = async () => {
    try {
        console.log('loadSessionsFromIndexedDB called');
        const sessions = await window.chatStorage.loadSessions();
        console.log('loadSessionsFromIndexedDB result:', sessions);
        return sessions;
    } catch (error) {
        console.error('Error loading sessions from IndexedDB:', error);
        throw error; // Re-throw to let .NET handle the fallback
    }
};

window.saveSettingToIndexedDB = async (key, value) => {
    try {
        await window.chatStorage.saveSetting(key, value);
        return true;
    } catch (error) {
        console.error('Error saving setting to IndexedDB:', error);
        return false;
    }
};

window.loadSettingFromIndexedDB = async (key) => {
    try {
        return await window.chatStorage.loadSetting(key);
    } catch (error) {
        console.error('Error loading setting from IndexedDB:', error);
        return null;
    }
};

// 텍스트 영역 자동 크기 조절 함수
window.autoResizeTextarea = (elementId) => {
    const element = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (element) {
        element.style.height = 'auto';
        element.style.height = Math.max(120, element.scrollHeight) + 'px';
    }
};

// 텍스트 영역에 자동 크기 조절 이벤트 리스너 추가
window.setupAutoResize = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        const resizeHandler = () => window.autoResizeTextarea(element);
        element.addEventListener('input', resizeHandler);
        element.addEventListener('paste', () => setTimeout(resizeHandler, 10));
        // 초기 크기 설정
        setTimeout(() => window.autoResizeTextarea(element), 10);
    }
};

// 클립보드에 텍스트 복사
window.copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                textArea.remove();
                return true;
            } catch (err) {
                textArea.remove();
                return false;
            }
        }
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
};

// IndexedDB 테스트 함수
window.testIndexedDB = async () => {
    try {
        console.log('Testing IndexedDB...');
        
        // 먼저 초기화 확인
        if (!window.chatStorage.isInitialized) {
            console.log('IndexedDB not initialized, initializing now...');
            await window.chatStorage.init();
        }
        
        // 테스트 세션 생성 (C# 속성명 사용)
        const testSessions = [{
            Id: '12345678-1234-1234-1234-123456789abc',
            Title: 'Test Session',
            History: [
                { Role: 'system', Text: 'You are a helpful assistant.' },
                { Role: 'user', Text: 'Hello' },
                { Role: 'assistant', Text: 'Hi there!' }
            ]
        }];
        
        console.log('Saving test sessions...');
        await window.saveSessionsToIndexedDB(testSessions);
        
        console.log('Loading test sessions...');
        const loaded = await window.loadSessionsFromIndexedDB();
        
        console.log('Test completed. Loaded sessions:', loaded);
        return loaded.length > 0;
    } catch (error) {
        console.error('IndexedDB test failed:', error);
        return false;
    }
};

// 디버그용 함수 - IndexedDB 데이터 모두 삭제
window.clearIndexedDB = async () => {
    try {
        if (!window.chatStorage.isInitialized) {
            await window.chatStorage.init();
        }
        
        const transaction = window.chatStorage.db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        
        console.log('IndexedDB cleared successfully');
        return true;
    } catch (error) {
        console.error('Error clearing IndexedDB:', error);
        return false;
    }
};
