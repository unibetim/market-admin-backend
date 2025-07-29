import React from 'react';
import styled from 'styled-components';
import LoadingSpinner from './LoadingSpinner';

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: ${props => {
    switch (props.size) {
      case 'sm': return '0.5rem 1rem';
      case 'lg': return '0.75rem 1.5rem';
      default: return '0.625rem 1.25rem';
    }
  }};
  font-size: ${props => {
    switch (props.size) {
      case 'sm': return '0.875rem';
      case 'lg': return '1rem';
      default: return '0.875rem';
    }
  }};
  font-weight: 600;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  outline: none;
  white-space: nowrap;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
          color: white;
          
          &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #e5e7eb;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
          }
        `;
      case 'success':
        return `
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          
          &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          color: white;
          
          &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          }
        `;
      case 'warning':
        return `
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: white;
          
          &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          color: #9ca3af;
          
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.05);
            color: #e5e7eb;
          }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #e5e7eb;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  
  ${props => props.fullWidth && 'width: 100%;'}
  ${props => props.className}
`;

const Button = ({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      className={className}
      {...props}
    >
      {loading && <LoadingSpinner size="16px" inline />}
      {children}
    </StyledButton>
  );
};

export default Button;
export { Button };