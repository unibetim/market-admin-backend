import React from 'react';
import styled from 'styled-components';

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

const Label = styled.label`
  color: #e5e7eb;
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Required = styled.span`
  color: #ef4444;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: #6b7280;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  ${props => props.error && `
    border-color: #ef4444;
    
    &:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  `}
`;

const StyledTextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: #6b7280;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  ${props => props.error && `
    border-color: #ef4444;
    
    &:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  `}
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: rgba(255, 255, 255, 0.08);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  option {
    background: #1f2937;
    color: #e5e7eb;
  }
  
  ${props => props.error && `
    border-color: #ef4444;
    
    &:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  `}
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const HelpText = styled.div`
  color: #9ca3af;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const Input = ({
  label,
  required = false,
  error,
  helpText,
  type = 'text',
  multiline = false,
  options = [],
  className,
  ...props
}) => {
  const InputComponent = multiline ? StyledTextArea : type === 'select' ? StyledSelect : StyledInput;

  return (
    <InputContainer className={className}>
      {label && (
        <Label>
          {label}
          {required && <Required>*</Required>}
        </Label>
      )}
      
      {type === 'select' ? (
        <StyledSelect error={error} {...props}>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </StyledSelect>
      ) : (
        <InputComponent
          type={multiline ? undefined : type}
          error={error}
          {...props}
        />
      )}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {helpText && !error && <HelpText>{helpText}</HelpText>}
    </InputContainer>
  );
};

export default Input;
export { Input };