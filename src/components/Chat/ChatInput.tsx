import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import UsageInfo from '../UI/UsageInfo';

const ChatInput = () => {
  const userInput = useChatStore(state => state.userInput);
  const isSending = useChatStore(state => state.isSending);
  const error = useChatStore(state => state.error);
  const temperature = useChatStore(state => state.temperature);
  const availableModels = useChatStore(state => state.availableModels);
  const selectedModel = useChatStore(state => state.selectedModel);
  
  const setUserInput = useChatStore(state => state.setUserInput);
  const sendMessage = useChatStore(state => state.sendMessage);
  const setSelectedModel = useChatStore(state => state.setSelectedModel);
  const setTemperature = useChatStore(state => state.setTemperature);
  const toggleSettingsOverlay = useChatStore(state => state.toggleSettingsOverlay);
  const getEffectiveModel = useChatStore(state => state.getEffectiveModel);
  
  const [localInput, setLocalInput] = useState('');
  const [cancellationController, setCancellationController] = useState<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // userInput 변경 시 로컬 상태도 업데이트
  useEffect(() => {
    setLocalInput(userInput);
  }, [userInput]);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(200, Math.max(60, textareaRef.current.scrollHeight)) + 'px';
    }
  };

  useEffect(() => {
    autoResize();
  }, [localInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalInput(value);
    setUserInput(value);
    autoResize();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendOrCancel();
    }
  };

  const handleSendOrCancel = async () => {
    if (isSending) {
      // 취소
      if (cancellationController) {
        cancellationController.abort();
        setCancellationController(null);
      }
      return;
    }

    if (!localInput.trim()) return;

    try {
      const controller = new AbortController();
      setCancellationController(controller);
      
      await sendMessage(controller.signal);
      
      setCancellationController(null);
      
      // 포커스를 다시 텍스트 영역으로
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
      
    } catch (error) {
      setCancellationController(null);
      console.error('Send message error:', error);
    }
  };

  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value;
    await setSelectedModel(model);
  };

  const handleTemperatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const temp = parseFloat(e.target.value);
    await setTemperature(temp);
  };

  const effectiveModel = getEffectiveModel();

  return (
    <div className="chat-input-container">
      {error && (
        <div className="error-message">
          <i className="oi oi-warning"></i>
          {error}
        </div>
      )}
      
      <div className="chat-input-wrapper">
        <div className="input-controls">
          {/* 모델 선택 */}
          <div className="control-group">
            <label htmlFor="model-select">모델:</label>
            {availableModels.length > 0 ? (
              <select 
                id="model-select"
                value={selectedModel} 
                onChange={handleModelChange}
                className="model-select"
              >
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                placeholder="모델명을 입력하세요"
                className="model-input"
              />
            )}
            <span className="effective-model">사용 중: {effectiveModel}</span>
          </div>

          {/* 온도 설정 */}
          <div className="control-group">
            <label htmlFor="temperature-range">온도:</label>
            <input
              id="temperature-range"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={handleTemperatureChange}
              className="temperature-range"
            />
            <span className="temperature-value">{temperature.toFixed(1)}</span>
          </div>

          {/* 설정 버튼 */}
          <button
            className="settings-btn"
            onClick={toggleSettingsOverlay}
            title="설정"
          >
            <i className="oi oi-cog"></i>
          </button>

          {/* 사용량 정보 */}
          <UsageInfo />
        </div>

        <div className="input-area">
          <textarea
            ref={textareaRef}
            value={localInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
            className="message-input"
            disabled={isSending}
          />
          
          <button
            onClick={handleSendOrCancel}
            disabled={!localInput.trim() && !isSending}
            className={`send-btn ${isSending ? 'sending' : ''}`}
            title={isSending ? "전송 취소" : "메시지 전송"}
          >
            {isSending ? (
              <i className="oi oi-x"></i>
            ) : (
              <i className="oi oi-arrow-right"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;