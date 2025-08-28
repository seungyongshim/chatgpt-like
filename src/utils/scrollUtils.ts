// 스크롤 관련 유틸리티 함수들

interface ScrollState {
  autoScrollEnabled: boolean;
  isUserScrolling: boolean;
  scrollDebounceTimer: number | null;
}

class ScrollUtils {
  private state: ScrollState = {
    autoScrollEnabled: true,
    isUserScrolling: false,
    scrollDebounceTimer: null
  };

  // 초기화
  setupScrollDetection() {
    let scrollTimeout: number;
    
    const handleScroll = () => {
      // 사용자가 스크롤 중임을 표시
      this.state.isUserScrolling = true;
      
      // 스크롤이 멈춘 후 800ms 뒤에 상태 초기화
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        this.state.isUserScrolling = false;
        
        // 맨 아래 근처에 있으면 자동 스크롤 재활성화
        const isNearBottom = this.isNearBottom();
        this.state.autoScrollEnabled = isNearBottom;
        
        console.log(`Auto scroll enabled: ${this.state.autoScrollEnabled}, near bottom: ${isNearBottom}`);
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
  }

  // 페이지 하단 근처인지 확인
  isNearBottom(): boolean {
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
  }

  // 자동 스크롤이 활성화된 경우에만 스크롤
  scrollToBottomIfEnabled() {
    if (this.state.autoScrollEnabled && !this.state.isUserScrolling) {
      this.scrollToBottom();
    } else {
      console.log('Auto scroll skipped - user is scrolling or disabled');
    }
  }

  // 전체 페이지를 맨 아래로 스크롤
  scrollToBottom() {
    try {
      // 디바운스 처리
      if (this.state.scrollDebounceTimer) {
        clearTimeout(this.state.scrollDebounceTimer);
      }
      
      this.state.scrollDebounceTimer = window.setTimeout(() => {
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
        this.state.scrollDebounceTimer = null;
      }, 10);
      
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }

  // 부드러운 스크롤
  smoothScrollToBottom() {
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
  }

  // 새 메시지를 위한 스크롤
  scrollToBottomForNewMessage() {
    // 자동 스크롤이 비활성화되어 있어도 새 메시지에 대해서는 스크롤
    const wasAutoScrollEnabled = this.state.autoScrollEnabled;
    this.state.autoScrollEnabled = true;
    
    // 약간의 지연 후 스크롤 (DOM 업데이트 대기)
    setTimeout(() => {
      this.scrollToBottom();
      
      // 원래 상태로 복원
      setTimeout(() => {
        this.state.autoScrollEnabled = wasAutoScrollEnabled;
      }, 100);
    }, 50);
  }

  // 스트리밍 중 스크롤 (throttled 버전)
  scrollToBottomThrottled = (() => {
    let lastScrollTime = 0;
    const throttleMs = 150; // 150ms마다 최대 한 번만 스크롤
    
    return () => {
      const now = Date.now();
      if (now - lastScrollTime > throttleMs) {
        lastScrollTime = now;
        if (this.state.autoScrollEnabled && !this.state.isUserScrolling) {
          this.scrollToBottom();
        }
      }
    };
  })();

  // 모바일 가상 키보드 감지 및 처리
  setupMobileKeyboardDetection() {
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
            this.scrollToBottomForNewMessage();
          }, 300);
        } 
        // 가상 키보드가 사라졌을 때
        else if (heightDifference < 50) {
          console.log('Virtual keyboard hidden');
          document.documentElement.style.setProperty('--app-vh', `${currentViewportHeight}px`);
          
          // 키보드가 사라진 후 스크롤 위치 조정
          setTimeout(() => {
            this.scrollToBottomForNewMessage();
          }, 300);
        }
      };
      
      window.addEventListener('resize', handleResize, { passive: true });
      
      // 초기 viewport height 설정
      document.documentElement.style.setProperty('--app-vh', `${initialViewportHeight}px`);
      
      console.log('Mobile keyboard detection setup complete');
    }
  }

  // 모바일 환경에서 입력창 포커스 시 스크롤 조정
  setupMobileInputFocus() {
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
            this.scrollToBottomIfEnabled();
          }, 300);
        }, { passive: true });
      });
      
      console.log('Mobile input focus handling setup complete');
    }
  }

  // 텍스트 영역 자동 크기 조절
  autoResizeTextarea(element: HTMLTextAreaElement | string) {
    const textarea = typeof element === 'string' ? document.getElementById(element) as HTMLTextAreaElement : element;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(120, textarea.scrollHeight) + 'px';
    }
  }

  // 상태 리셋 (컴포넌트 언마운트 시 사용)
  cleanup() {
    if (this.state.scrollDebounceTimer) {
      clearTimeout(this.state.scrollDebounceTimer);
      this.state.scrollDebounceTimer = null;
    }
    this.state.autoScrollEnabled = true;
    this.state.isUserScrolling = false;
  }
}

// 전역 인스턴스 생성
export const scrollUtils = new ScrollUtils();

// 개별 함수들도 export (기존 JS 코드와의 호환성을 위해)
export const setupScrollDetection = () => scrollUtils.setupScrollDetection();
export const isNearBottom = () => scrollUtils.isNearBottom();
export const scrollToBottomIfEnabled = () => scrollUtils.scrollToBottomIfEnabled();
export const scrollToBottom = () => scrollUtils.scrollToBottom();
export const smoothScrollToBottom = () => scrollUtils.smoothScrollToBottom();
export const scrollToBottomForNewMessage = () => scrollUtils.scrollToBottomForNewMessage();
export const scrollToBottomThrottled = () => scrollUtils.scrollToBottomThrottled();
export const setupMobileKeyboardDetection = () => scrollUtils.setupMobileKeyboardDetection();
export const setupMobileInputFocus = () => scrollUtils.setupMobileInputFocus();
export const autoResizeTextarea = (element: HTMLTextAreaElement | string) => scrollUtils.autoResizeTextarea(element);

export default scrollUtils;