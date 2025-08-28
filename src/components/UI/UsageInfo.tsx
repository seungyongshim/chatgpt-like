import { useChatStore } from '../../stores/chatStore';

const UsageInfo = () => {
  const currentUsage = useChatStore(state => state.currentUsage);
  const loadingUsage = useChatStore(state => state.loadingUsage);
  const loadUsage = useChatStore(state => state.loadUsage);

  const handleRefresh = async () => {
    await loadUsage();
  };

  if (loadingUsage) {
    return (
      <div className="usage-info">
        <span className="usage-text">사용량 조회 중...</span>
      </div>
    );
  }

  if (!currentUsage) {
    return (
      <div className="usage-info">
        <button 
          className="usage-refresh-btn" 
          onClick={handleRefresh}
          title="사용량 새로고침"
        >
          <i className="oi oi-reload"></i>
        </button>
      </div>
    );
  }

  const { premiumRequestsLeft, totalPremiumRequests, premiumRequestsUsed } = currentUsage;

  return (
    <div className="usage-info">
      {premiumRequestsLeft !== undefined && totalPremiumRequests !== undefined ? (
        <span className="usage-text">
          {premiumRequestsLeft} / {totalPremiumRequests} 남음
          {premiumRequestsUsed !== undefined && ` (${premiumRequestsUsed} 사용)`}
        </span>
      ) : (
        <span className="usage-text">사용량 정보 없음</span>
      )}
      
      <button 
        className="usage-refresh-btn" 
        onClick={handleRefresh}
        title="사용량 새로고침"
      >
        <i className="oi oi-reload"></i>
      </button>
    </div>
  );
};

export default UsageInfo;