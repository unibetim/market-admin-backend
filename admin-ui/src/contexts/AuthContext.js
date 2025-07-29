import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));

  // 配置axios默认设置
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    
    // 设置基础URL
    axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
      ? '/api' 
      : 'http://localhost:3001/api';
  }, [token]);

  // 初始化时验证token
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/auth/verify');
          if (response.data.success) {
            setUser(response.data.data.user);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Token验证失败:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        setToken(token);
        setUser(user);
        localStorage.setItem('admin_token', token);
        
        toast.success('登录成功！');
        return { success: true };
      } else {
        toast.error(response.data.message || '登录失败');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || '登录失败，请检查网络连接';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post('/auth/logout');
      }
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('admin_token');
      delete axios.defaults.headers.common['Authorization'];
      toast.success('已退出登录');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        toast.success('密码修改成功！请重新登录');
        logout();
        return { success: true };
      } else {
        toast.error(response.data.message || '密码修改失败');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || '密码修改失败';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};