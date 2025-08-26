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
                    sessionStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
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
                lastUpdated: session.LastUpdated || session.lastUpdated || new Date().toISOString(),
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
                    History: session.history,
                    LastUpdated: session.lastUpdated ? new Date(session.lastUpdated) : new Date()
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

// 자동 스크롤 상태 관리
window.autoScrollEnabled = true;
window.isUserScrolling = false;
window.scrollDebounceTimer = null;

// 사용자가 수동으로 스크롤했는지 감지 (전체 페이지 스크롤용)
window.setupScrollDetection = () => {
    let scrollTimeout;
    
    const handleScroll = () => {
        // 사용자가 스크롤 중임을 표시
        window.isUserScrolling = true;
        
        // 스크롤이 멈춘 후 800ms 뒤에 상태 초기화
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            window.isUserScrolling = false;
            
            // 맨 아래 근처에 있으면 자동 스크롤 재활성화
            const isNearBottom = window.isNearBottom();
            window.autoScrollEnabled = isNearBottom;
            
            console.log(`Auto scroll enabled: ${window.autoScrollEnabled}, near bottom: ${isNearBottom}`);
        }, 800);
    };
    
    // 더 효율적인 스크롤 이벤트 처리
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    
    console.log('Page scroll detection setup complete');
};

// 페이지 하단 근처인지 확인하는 함수
window.isNearBottom = () => {
    const inputHeight = window.innerWidth <= 768 ? 200 : 180; // 모바일/데스크톱 구분
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );
    
    const isNear = scrollTop + windowHeight >= documentHeight - inputHeight - 50;
    return isNear;
};

// 자동 스크롤이 활성화된 경우에만 스크롤
window.scrollToBottomIfEnabled = () => {
    if (window.autoScrollEnabled && !window.isUserScrolling) {
        window.scrollToBottom();
    } else {
        console.log('Auto scroll skipped - user is scrolling or disabled');
    }
};

// 전체 페이지를 맨 아래로 스크롤 (개선된 버전)
window.scrollToBottom = () => {
    try {
        // 디바운스 처리
        if (window.scrollDebounceTimer) {
            clearTimeout(window.scrollDebounceTimer);
        }
        
        window.scrollDebounceTimer = setTimeout(() => {
            const isMobile = window.innerWidth <= 768;
            const inputHeight = isMobile ? 200 : 180; // 모바일에서 더 큰 여백
            
            const documentHeight = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            );
            
            // 타겟 스크롤 위치 계산 (약간의 추가 여백)
            const targetScroll = Math.max(0, documentHeight - window.innerHeight + inputHeight + 20);
            
            console.log(`Mobile: ${isMobile}, Document height: ${documentHeight}, Window height: ${window.innerHeight}, Target scroll: ${targetScroll}`);
            
            // 즉시 스크롤
            window.scrollTo({
                top: targetScroll,
                behavior: 'auto'
            });
            
            // DOM 업데이트를 위한 재스크롤
            requestAnimationFrame(() => {
                const newDocumentHeight = Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight
                );
                const finalTargetScroll = Math.max(0, newDocumentHeight - window.innerHeight + inputHeight + 20);
                
                if (Math.abs(finalTargetScroll - targetScroll) > 10) {
                    window.scrollTo({
                        top: finalTargetScroll,
                        behavior: 'auto'
                    });
                    console.log(`Adjusted scroll position: ${finalTargetScroll}`);
                }
            });
            
            console.log('Successfully scrolled to bottom (page scroll)');
        }, 10);
        
    } catch (error) {
        console.error('Error scrolling to bottom:', error);
    }
};

// 전체 페이지를 부드럽게 맨 아래로 스크롤 (개선된 버전)
window.smoothScrollToBottom = () => {
    try {
        const isMobile = window.innerWidth <= 768;
        const inputHeight = isMobile ? 200 : 180;
        
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
        
        const targetScroll = Math.max(0, documentHeight - window.innerHeight + inputHeight + 20);
        
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
        
        console.log('Smooth scrolled to bottom (page scroll)');
    } catch (error) {
        console.error('Error smooth scrolling to bottom:', error);
    }
};

// 새 메시지를 위한 스크롤 (메시지 추가 시 사용)
window.scrollToBottomForNewMessage = () => {
    // 자동 스크롤이 비활성화되어 있어도 새 메시지에 대해서는 스크롤
    const wasAutoScrollEnabled = window.autoScrollEnabled;
    window.autoScrollEnabled = true;
    
    // 약간의 지연 후 스크롤 (DOM 업데이트 대기)
    setTimeout(() => {
        window.scrollToBottom();
        
        // 원래 상태로 복원
        setTimeout(() => {
            window.autoScrollEnabled = wasAutoScrollEnabled;
        }, 100);
    }, 50);
};

// 스트리밍 중 스크롤 (덜 빈번하게)
window.scrollToBottomThrottled = (() => {
    let lastScrollTime = 0;
    const throttleMs = 150; // 150ms마다 최대 한 번만 스크롤
    
    return () => {
        const now = Date.now();
        if (now - lastScrollTime > throttleMs) {
            lastScrollTime = now;
            if (window.autoScrollEnabled && !window.isUserScrolling) {
                window.scrollToBottom();
            }
        }
    };
})();

// 모바일 가상 키보드 감지 및 처리
window.setupMobileKeyboardDetection = () => {
    if (window.innerWidth <= 768) { // 모바일 환경에서만
        let initialViewportHeight = window.innerHeight;
        let currentViewportHeight = window.innerHeight;
        
        const handleResize = () => {
            currentViewportHeight = window.innerHeight;
            const heightDifference = initialViewportHeight - currentViewportHeight;
            
            // 가상 키보드가 나타났을 때 (높이가 크게 줄어들었을 때)
            if (heightDifference > 150) {
                console.log('Virtual keyboard detected');
                document.documentElement.style.setProperty('--app-vh', `${currentViewportHeight}px`);
                
                // 키보드가 나타난 후 잠시 기다렸다가 스크롤
                setTimeout(() => {
                    window.scrollToBottomForNewMessage();
                }, 300);
            } 
            // 가상 키보드가 사라졌을 때
            else if (heightDifference < 50) {
                console.log('Virtual keyboard hidden');
                document.documentElement.style.setProperty('--app-vh', `${currentViewportHeight}px`);
                
                // 키보드가 사라진 후 스크롤 위치 조정
                setTimeout(() => {
                    window.scrollToBottomForNewMessage();
                }, 300);
            }
        };
        
        window.addEventListener('resize', handleResize, { passive: true });
        
        // 초기 viewport height 설정
        document.documentElement.style.setProperty('--app-vh', `${initialViewportHeight}px`);
        
        console.log('Mobile keyboard detection setup complete');
    }
};

// 모바일 환경에서 입력창 포커스 시 스크롤 조정
window.setupMobileInputFocus = () => {
    if (window.innerWidth <= 768) {
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                console.log('Input focused on mobile');
                setTimeout(() => {
                    // 입력창이 보이도록 스크롤
                    input.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300); // iOS 키보드 애니메이션 대기
            }, { passive: true });
            
            input.addEventListener('blur', () => {
                console.log('Input blurred on mobile');
                setTimeout(() => {
                    window.scrollToBottomIfEnabled();
                }, 300);
            }, { passive: true });
        });
        
        console.log('Mobile input focus handling setup complete');
    }
};
