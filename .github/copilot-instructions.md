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
    ````instructions
    # ChatGPT-like React App · 에이전트 작업 가이드

    프로젝트는 React + TypeScript + Vite 기반의 Chat UI로, 상태는 `Zustand`로 단일 저장소(`src/stores/chatStore.ts`)에서 관리되고, 백엔드 호출은 `src/services` 계층으로 분리됩니다.

    ## 아키텍처 · 데이터 흐름(핵심)
    - 컴포넌트(`src/components/**`) → 저장소(`useChatStore`) → 서비스(`chatService`/`storageService`) → 저장소 갱신 → UI 반영의 단방향 흐름을 유지합니다.
    - 채팅 흐름: `ChatInput`이 `sendMessage(signal)` 호출 → `chatStore.sendMessage`가 사용자 메시지를 추가 후 어시스턴트 빈 메시지 생성 → `chatService.getResponseStreaming`으로 SSE/스트림 청크를 수신하며 마지막 어시스턴트 메시지 내용을 누적 갱신합니다.
    - 메시지 렌더링: `MessageList`는 첫 `system` 메시지를 분리 표시하고, 나머지는 순서대로 렌더링합니다. 편집/삭제/재전송은 전부 저장소 액션을 통해 처리합니다.

    ## 백엔드 API 계약(OpenAI 호환 + 일부 폴백)
    - Base URL: 기본 `http://localhost:4141` (`src/services/chatService.ts`의 `ChatService`). 필요 시 인스턴스 생성부를 수정해 교체하세요.
    - GET `/v1/models`: 우선 `{ data: [{ id }] }`에서 `id` 수집, 없으면 `{ models: string[] }` 폴백. 실패 시 `localStorage('LAST_MODEL')`로 복원하여 입력 박스(드롭다운 대신) 노출.
    - POST `/v1/chat/completions`(stream: true): 각 줄이 `data: ...` 형식. OpenAI 스트리밍 규약의 `choices[0].delta.content`를 누적. 헤더는 `Content-Type: application/json`과 `anthropic-beta: output-128k-2025-02-19`를 전송합니다.
    - GET `/usage`: `quota_snapshots.premium_interactions.{remaining,entitlement}`에서 사용량을 계산하여 `UsageInfo`로 매핑합니다.

    ## 상태/지속성 관례(저장소가 단일 진실 소스)
    - 세션(`Session`): 첫 메시지는 항상 `system`. 새 채팅은 현재 `systemMessage`로 시작. 제목은 첫 사용자 메시지 20자 기준 생성(`updateSessionTitle`). 마지막 한 개 세션은 삭제 금지.
    - 모델 설정은 모델별 키로 저장: `MODEL_SETTINGS::${model}`에 `{ temperature, maxTokens }`. 최근 모델은 `LAST_MODEL`.
    - 테마는 `<html data-theme>`로 제어하며 `THEME_PREFERENCE`에 `dark|light` 저장. 시스템 메시지는 `SYSTEM_MESSAGE`에도 동기화.
    - 영속화는 IndexedDB 우선(`ChatAppDB` v1, 오브젝트 스토어: `sessions`, `settings`) → 실패 시 `localStorage` 폴백. 세션 저장 시 `sessions` 스토어를 `clear()` 후 전체 재기록합니다.

    ## 개발 워크플로우(명령/포트)
    - 설치/개발/빌드/린트: `npm install` · `npm run dev`(포트 `5173`) · `npm run build` · `npm run lint`.
    - 프록시 설정 없음(Vite). 백엔드(4141)는 별도 구동 필요. CORS 문제 시 백엔드 허용 또는 Vite 프록시 추가를 검토하세요.

    ## 확장 패턴(이 코드베이스에서의 방법)
    - 새 API 연동: `src/services/chatService.ts`에 메서드 추가 → 저장소 액션에서 호출/상태 갱신 → 컴포넌트는 `useChatStore`만 사용.
      ```tsx
      // 컴포넌트 예시
      const messages = useChatStore(s => s.messages);
      const sendMessage = useChatStore(s => s.sendMessage);
      ```
    - 스트림 취소/중단은 `AbortController`를 통해 처리합니다. UI에서 컨트롤러를 생성해 `sendMessage(controller.signal)`로 전달하세요(`ChatInput` 참고).

    ## 주의할 점(이 프로젝트 특이사항)
    - 스트리밍 중 오류 시, 비어있는 어시스턴트 자리표시자는 제거합니다(저장소 로직 내 처리). 시간초과/취소 메시지 구분 처리 존재.
    - 모델 목록이 비어있으면 드롭다운 대신 자유 입력 필드가 노출됩니다(직접 모델 ID 입력 가능).
    - `MessageList`는 `system`을 맨 위로 분리하므로 인덱싱 시 원본 배열 인덱스를 유지해야 합니다(컴포넌트가 원본 인덱스를 전달).
    - `Date`는 저장 시 ISO 문자열, 로드시 `Date`로 재구성합니다(`StorageService` 변환 참조).

    핵심 참조 파일: `src/stores/chatStore.ts`, `src/services/{chatService,storageService,types}.ts`, `src/components/Chat/*`, `src/styles/css/*`, `vite.config.ts`, `package.json`.
    ````
