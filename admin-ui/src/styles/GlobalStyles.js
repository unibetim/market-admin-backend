import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
    color: #ffffff;
    overflow-x: hidden;
    font-size: 14px;
  }

  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* 滚动条样式 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    transition: background 0.2s ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* 链接样式 */
  a {
    color: #60a5fa;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #93c5fd;
    }
  }

  /* 按钮重置 */
  button {
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
    outline: none;
    transition: all 0.2s ease;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  /* 输入框重置 */
  input, textarea, select {
    font-family: inherit;
    outline: none;
    border: none;
    background: transparent;
    color: inherit;
  }

  /* 表格重置 */
  table {
    border-collapse: collapse;
    width: 100%;
  }

  /* 列表重置 */
  ul, ol {
    list-style: none;
  }

  /* 图片响应式 */
  img {
    max-width: 100%;
    height: auto;
  }

  /* 工具类 */
  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .gap-1 { gap: 0.25rem; }
  .gap-2 { gap: 0.5rem; }
  .gap-3 { gap: 0.75rem; }
  .gap-4 { gap: 1rem; }
  .gap-6 { gap: 1.5rem; }

  .text-xs { font-size: 0.75rem; }
  .text-sm { font-size: 0.875rem; }
  .text-base { font-size: 1rem; }
  .text-lg { font-size: 1.125rem; }
  .text-xl { font-size: 1.25rem; }
  .text-2xl { font-size: 1.5rem; }

  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }

  .text-gray-400 { color: #9ca3af; }
  .text-gray-300 { color: #d1d5db; }
  .text-gray-200 { color: #e5e7eb; }
  .text-white { color: #ffffff; }

  .text-blue-400 { color: #60a5fa; }
  .text-green-400 { color: #4ade80; }
  .text-red-400 { color: #f87171; }
  .text-yellow-400 { color: #facc15; }

  .bg-gray-800 { background-color: #1f2937; }
  .bg-gray-700 { background-color: #374151; }
  .bg-gray-600 { background-color: #4b5563; }

  .rounded { border-radius: 0.25rem; }
  .rounded-md { border-radius: 0.375rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-xl { border-radius: 0.75rem; }

  .p-1 { padding: 0.25rem; }
  .p-2 { padding: 0.5rem; }
  .p-3 { padding: 0.75rem; }
  .p-4 { padding: 1rem; }
  .p-6 { padding: 1.5rem; }

  .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
  .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  
  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }

  .m-1 { margin: 0.25rem; }
  .m-2 { margin: 0.5rem; }
  .m-4 { margin: 1rem; }

  .mb-2 { margin-bottom: 0.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-6 { margin-bottom: 1.5rem; }

  .mt-2 { margin-top: 0.5rem; }
  .mt-4 { margin-top: 1rem; }
  .mt-6 { margin-top: 1.5rem; }

  .w-full { width: 100%; }
  .h-full { height: 100%; }

  .shadow-sm {
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .shadow-md {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  /* 动画 */
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  .slide-up {
    animation: slideUp 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 响应式 */
  @media (max-width: 768px) {
    html {
      font-size: 14px;
    }
    
    .container {
      padding: 1rem;
    }
  }

  @media (max-width: 480px) {
    html {
      font-size: 13px;
    }
  }

  /* 选中文本样式 */
  ::selection {
    background-color: rgba(59, 130, 246, 0.3);
    color: #ffffff;
  }

  /* Focus outline */
  .focus-ring:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Hover effects */
  .hover-scale:hover {
    transform: scale(1.02);
  }

  .hover-brightness:hover {
    filter: brightness(1.1);
  }
`;

export default GlobalStyles;