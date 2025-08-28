import { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { StorageService } from '../../services/storageService';
import { chatService } from '../../services/chatService';

const SettingsPanel = () => {
  const showSettingsOverlay = useChatStore(state => state.showSettingsOverlay);
  const systemMessage = useChatStore(state => state.systemMessage);
  const maxTokens = useChatStore(state => state.maxTokens);
  const selectedModel = useChatStore(state => state.selectedModel);
  
  const setSystemMessage = useChatStore(state => state.setSystemMessage);
  const setMaxTokens = useChatStore(state => state.setMaxTokens);
  const saveModelSettings = useChatStore(state => state.saveModelSettings);
  const closeSettingsOverlay = useChatStore(state => state.closeSettingsOverlay);
  
  const [localSystemMessage, setLocalSystemMessage] = useState(systemMessage);
  const [localMaxTokens, setLocalMaxTokens] = useState(maxTokens?.toString() || '');
  const [defaultModel, setDefaultModel] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionOk, setConnectionOk] = useState(false);

  if (!showSettingsOverlay) return null;

  const handleSystemMessageChange = async () => {
    await setSystemMessage(localSystemMessage);
    setSaveStatus('시스템 메시지가 저장되었습니다.');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleModelSettingsChange = async () => {
    const tokens = localMaxTokens ? parseInt(localMaxTokens) : null;
    setMaxTokens(tokens);
    await saveModelSettings();
    setSaveStatus('모델 설정이 저장되었습니다.');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleSaveDefaults = async () => {
    localStorage.setItem('DEFAULT_MODEL', defaultModel);
    setSaveStatus('기본 설정이 저장되었습니다.');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleTestConnection = async () => {
    try {
      const models = await chatService.getModels();
      setConnectionOk(models.length >= 0);
      setConnectionStatus(connectionOk ? 'copilot-api 연결 성공' : '모델 목록이 비어있습니다');
    } catch (error) {
      setConnectionOk(false);
      setConnectionStatus(`연결 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestIndexedDB = async () => {
    try {
      const result = await StorageService.testStorage();
      setConnectionStatus(result ? 'IndexedDB 테스트 성공' : 'IndexedDB 테스트 실패');
      setConnectionOk(result);
    } catch (error) {
      setConnectionStatus(`IndexedDB 테스트 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionOk(false);
    }
  };

  const handleClearIndexedDB = async () => {
    try {
      const result = await StorageService.clearStorage();
      setConnectionStatus(result ? 'IndexedDB 초기화 완료' : 'IndexedDB 초기화 실패');
      setConnectionOk(result);
      
      if (result) {
        // 페이지 새로고침으로 앱 재초기화
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      setConnectionStatus(`IndexedDB 초기화 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionOk(false);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>설정</h2>
          <button 
            className="close-btn" 
            onClick={closeSettingsOverlay}
            title="닫기"
          >
            <i className="oi oi-x"></i>
          </button>
        </div>

        <div className="settings-content">
          {/* 시스템 메시지 설정 */}
          <div className="setting-group">
            <label htmlFor="system-message">시스템 메시지:</label>
            <textarea
              id="system-message"
              value={localSystemMessage}
              onChange={(e) => setLocalSystemMessage(e.target.value)}
              placeholder="시스템 메시지를 입력하세요..."
              className="system-message-input"
              rows={4}
            />
            <button onClick={handleSystemMessageChange} className="save-btn">
              시스템 메시지 저장
            </button>
          </div>

          {/* 모델 설정 */}
          <div className="setting-group">
            <h3>현재 모델 설정 ({selectedModel})</h3>
            
            <div className="setting-item">
              <label htmlFor="max-tokens">최대 토큰 수:</label>
              <input
                id="max-tokens"
                type="number"
                value={localMaxTokens}
                onChange={(e) => setLocalMaxTokens(e.target.value)}
                placeholder="비워두면 제한 없음"
                className="max-tokens-input"
                min="1"
                max="100000"
              />
            </div>
            
            <button onClick={handleModelSettingsChange} className="save-btn">
              모델 설정 저장
            </button>
          </div>

          {/* 기본 설정 */}
          <div className="setting-group">
            <h3>기본 설정</h3>
            
            <div className="setting-item">
              <label htmlFor="default-model">기본 모델:</label>
              <input
                id="default-model"
                type="text"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                placeholder="기본 모델명을 입력하세요"
                className="default-model-input"
              />
            </div>
            
            <button onClick={handleSaveDefaults} className="save-btn">
              기본 설정 저장
            </button>
          </div>

          {/* 연결 테스트 */}
          <div className="setting-group">
            <h3>연결 테스트</h3>
            
            <div className="test-buttons">
              <button onClick={handleTestConnection} className="test-btn">
                API 연결 테스트
              </button>
              
              <button onClick={handleTestIndexedDB} className="test-btn">
                IndexedDB 테스트
              </button>
              
              <button onClick={handleClearIndexedDB} className="test-btn danger">
                데이터 초기화
              </button>
            </div>
            
            {connectionStatus && (
              <div className={`connection-status ${connectionOk ? 'success' : 'error'}`}>
                <i className={`oi ${connectionOk ? 'oi-check' : 'oi-warning'}`}></i>
                {connectionStatus}
              </div>
            )}
          </div>

          {/* 저장 상태 */}
          {saveStatus && (
            <div className="save-status success">
              <i className="oi oi-check"></i>
              {saveStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;