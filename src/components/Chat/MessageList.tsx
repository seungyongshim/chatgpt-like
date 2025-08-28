import { useChatStore } from '../../stores/chatStore';
import MessageItem from './MessageItem';

const MessageList = () => {
  const messages = useChatStore(state => state.messages);

  // 시스템 메시지를 먼저 렌더링하고, 나머지 메시지들을 순서대로 렌더링
  const systemMessage = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');
  
  return (
    <div className="message-list">
      {systemMessage && (
        <MessageItem 
          message={systemMessage} 
          messageIndex={messages.indexOf(systemMessage)} 
        />
      )}
      
      {otherMessages.map((message) => {
        const originalIndex = messages.indexOf(message);
        return (
          <MessageItem 
            key={originalIndex} 
            message={message} 
            messageIndex={originalIndex} 
          />
        );
      })}
    </div>
  );
};

export default MessageList;