import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
`;

const Spinner = styled.div`
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border: 4px solid rgba(59, 130, 246, 0.1);
  border-top: 4px solid #3B82F6;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const Text = styled.div`
  color: #9ca3af;
  font-size: 0.875rem;
  margin-top: 1rem;
  text-align: center;
`;

const LoadingSpinner = ({ size, text, inline = false }) => {
  if (inline) {
    return <Spinner size={size} />;
  }

  return (
    <Container>
      <div>
        <Spinner size={size} />
        {text && <Text>{text}</Text>}
      </div>
    </Container>
  );
};

export default LoadingSpinner;
export { LoadingSpinner };