# 이 프로젝트에 대하여

이것은 React, TypeScript, Vite로 구축된 ChatGPT와 유사한 웹 애플리케이션입니다. 반응형 UI, 채팅 세션 관리 및 구성 가능한 AI 모델 설정을 제공합니다.

## 아키텍처

이 애플리케이션은 최신 프론트엔드 아키텍처를 따릅니다:

-   **프레임워크:** 타입 안전성을 위해 TypeScript와 함께 React를 사용합니다.
-   **상태 관리:** [Zustand](https://github.com/pmndrs/zustand)를 사용하여 전역 상태를 관리합니다. 전체 애플리케이션 상태는 `src/stores/chatStore.ts`에 중앙 집중화되어 있습니다. 이것이 UI 상태, 채팅 기록 및 설정의 단일 소스입니다. 대부분의 변경 사항은 이 저장소를 수정하는 것을 포함합니다.
-   **백엔드 통신:** 백엔드 AI 서비스와의 모든 상호 작용은 `src/services/chatService.ts`에서 처리됩니다. 이 서비스는 모델을 가져오고(`/v1/models`) 채팅 완료를 스트리밍(`/v1/chat/completions`)하기 위한 OpenAI 호환 API를 기대합니다.
-   **컴포넌트 구조:** 컴포넌트는 `src/components` 아래 기능별로 구성됩니다.
-   **스타일링:** 전역 스타일 및 컴포넌트별 스타일은 `src/styles/css`에 있습니다. 애플리케이션은 `<html>` 요소의 `data-theme` 속성에 의해 제어되고 `chatStore.ts`에서 관리되는 다크 및 라이트 테마를 지원합니다.
-   **지속성:** 채팅 세션은 `StorageService`(IndexedDB 또는 유사한 브라우저 저장소를 사용할 가능성이 높음)를 사용하여 지속되며, 테마 및 모델 설정은 `localStorage`에 저장됩니다.

## 개발자 워크플로우

### 전제 조건

애플리케이션은 OpenAI API와 호환되는 실행 중인 백엔드 서비스가 필요합니다. 기본적으로 `http://localhost:4141`에 연결합니다.

### 시작하기

1.  **의존성 설치:**
    ```bash
    npm install
    ```
2.  **개발 서버 실행:**
    ```bash
    npm run dev
    ```
    애플리케이션은 `http://localhost:5173`에서 사용할 수 있습니다.

### 주요 스크립트

-   `npm run dev`: Vite 개발 서버를 시작합니다.
-   `npm run build`: TypeScript를 컴파일하고 프로덕션을 위해 애플리케이션을 `dist` 디렉토리에 빌드합니다.
-   `npm run lint`: ESLint를 사용하여 코드베이스를 린트합니다.

## 핵심 개념 및 패턴

### Zustand를 사용한 상태 관리

-   **저장소:** `src/stores/chatStore.ts`는 애플리케이션의 로직을 이해하는 데 가장 중요한 파일입니다. 채팅 세션, 메시지, 모델 설정 및 UI 토글을 관리하기 위한 상태와 작업을 포함합니다.
-   **상태 접근:** React 컴포넌트에서 `useChatStore` 훅을 사용하여 상태와 작업에 접근합니다.
    ```tsx
    // 컴포넌트 예시
    import { useChatStore } from '../stores/chatStore';

    const messages = useChatStore(state => state.messages);
    const sendMessage = useChatStore(state => state.sendMessage);
    ```
-   **상태 수정:** 저장소 내의 작업은 상태를 수정하는 데 사용됩니다. 이러한 작업은 종종 비동기적이며 `chatService` 또는 `storageService`와 같은 서비스와 상호 작용합니다.

### 서비스 계층

-   `src/services/chatService.ts`의 `ChatService`는 모든 API 호출을 추상화합니다.
-   핵심 기능인 채팅 메시지에 대한 스트리밍 응답을 처리합니다. `getResponseStreaming` 비동기 생성기는 이 기능의 핵심입니다.
-   새로운 백엔드 상호 작용을 추가하려면 이 서비스를 확장하십시오.

### 세션 및 메시지 관리

-   `Session` 객체(`src/services/types.ts`)는 단일 채팅 대화를 나타냅니다.
-   `chatStore`는 세션 목록과 현재 활성 세션을 관리합니다.
-   세션 내의 메시지는 `ChatMessage` 객체의 배열입니다. 첫 번째 메시지는 항상 `system` 메시지입니다.
