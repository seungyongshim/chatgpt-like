// IndexedDB를 사용한 채팅 데이터 저장소
class ChatStorage {
    constructor() {
        this.dbName = 'ChatAppDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 세션 스토어 생성
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionStore.createIndex('title', 'title', { unique: false });
                    sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                // 설정 스토어 생성
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async saveSessions(sessions) {
        if (!this.db) await this.init();
        
        const transaction = this.db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        
        // 기존 세션들 삭제
        await store.clear();
        
        // 새 세션들 저장
        for (const session of sessions) {
            await store.add({
                id: session.Id,
                title: session.Title,
                history: session.History,
                createdAt: new Date().toISOString()
            });
        }
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
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
                resolve(sessions);
            };
            request.onerror = () => reject(request.error);
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

// .NET에서 호출할 수 있는 함수들
window.saveSessionsToIndexedDB = async (sessions) => {
    try {
        await window.chatStorage.saveSessions(sessions);
        return true;
    } catch (error) {
        console.error('Error saving sessions to IndexedDB:', error);
        return false;
    }
};

window.loadSessionsFromIndexedDB = async () => {
    try {
        return await window.chatStorage.loadSessions();
    } catch (error) {
        console.error('Error loading sessions from IndexedDB:', error);
        return [];
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
