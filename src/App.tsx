import { useEffect } from 'react';
import { useChatStore } from './stores/chatStore';
import ChatContainer from './components/Chat/ChatContainer';
import ChatSidebar from './components/Sidebar/ChatSidebar';
import SettingsPanel from './components/Settings/SettingsPanel';
import ThemeToggle from './components/UI/ThemeToggle';
import { scrollUtils } from './utils/scrollUtils';

function App() {
  const initializeApp = useChatStore(state => state.initializeApp);
  const showSettingsOverlay = useChatStore(state => state.showSettingsOverlay);

  useEffect(() => {
    const initialize = async () => {
      await initializeApp();
      
      // 스크롤 감지 설정
      scrollUtils.setupScrollDetection();
      
      // 모바일 환경 최적화 설정
      scrollUtils.setupMobileKeyboardDetection();
      scrollUtils.setupMobileInputFocus();
      
      // 페이지 첫 로드 시 맨 아래로 스크롤 (약간의 지연 후)
      setTimeout(() => {
        scrollUtils.scrollToBottomForNewMessage();
      }, 150);
    };

    initialize();

    // 컴포넌트 언마운트 시 정리
    return () => {
      scrollUtils.cleanup();
    };
  }, [initializeApp]);

  return (
    <div className="app">
      <ThemeToggle />
      
      <div className="chat-layout">
        <ChatSidebar />
        <ChatContainer />
      </div>

      {showSettingsOverlay && <SettingsPanel />}
    </div>
  );
}

export default App;