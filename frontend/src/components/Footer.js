import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

function Footer() {
  return (
    <footer className="bg-dark text-white py-4 mt-5">
      <Container>
        <Row>
          <Col md={6} className="mb-3 mb-md-0">
            <h5>Blood Donor Finder</h5>
            <p className="mb-0">Connecting blood donors and recipients since 2025</p>
          </Col>
          <Col md={6} className="text-md-end">
            <p className="mb-0">&copy; {new Date().getFullYear()} Blood Donor Finder. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
