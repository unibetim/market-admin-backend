import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import GlobalStyles from './styles/GlobalStyles';
import { AuthProvider } from './contexts/AuthContext';

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
      refetchOnWindowFocus: false,
      retry: 2
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter basename="/admin">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GlobalStyles />
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151'
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f9fafb'
                }
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f9fafb'
                }
              }
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);