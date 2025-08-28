import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatContainer = () => {
  return (
    <main className="chat-main">
      <div className="chat-container">
        <MessageList />
      </div>
      <ChatInput />
    </main>
  );
};

export default ChatContainer;