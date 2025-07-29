import React from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const ContentInner = styled.div`
  flex: 1;
  padding: 1.5rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Layout = ({ children }) => {
  return (
    <Container>
      <Sidebar />
      <Main>
        <Header />
        <Content>
          <ContentInner>
            {children}
          </ContentInner>
          <Footer />
        </Content>
      </Main>
    </Container>
  );
};

export default Layout;