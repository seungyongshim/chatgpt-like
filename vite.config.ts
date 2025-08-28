import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Node 전역에 대한 타입 경고 억제
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;

// GitHub Actions에서 빌드되는 경우 리포지토리 이름을 base로 사용
// 예: seungyongshim/chatgpt-like -> /chatgpt-like/
const ghBase = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/';

export default defineConfig({
  base: ghBase,
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})