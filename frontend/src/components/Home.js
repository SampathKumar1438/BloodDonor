import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../bloodAnimation.css';

// Blood Donation Animation Component with Heart Shape
const BloodDonationAnimation = () => {
  const [animationStep, setAnimationStep] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [bloodType, setBloodType] = useState('A+');
  const [pulseEffect, setPulseEffect] = useState(1);
  
  // Update animation frame
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 100);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  // Cycle through blood types
  useEffect(() => {
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const interval = setInterval(() => {
      setBloodType(bloodTypes[Math.floor(Math.random() * bloodTypes.length)]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Heart pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(prev => prev === 1 ? 1.05 : 1);
    }, 800);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="donation-container-wrapper" style={{ position: 'relative', width: '100%', height: '400px' }}>
      {/* Left side content */}
      <div className="donation-content-side" style={{
        position: 'absolute',
        left: '0',
        top: '0',
        width: '40%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '20px',
        zIndex: 3
      }}>
        <div style={{
          fontSize: '22px',
          fontWeight: 'bold',
          marginBottom: '10px',
          color: '#cc0000',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          Every Drop Counts
        </div>
        
        <div style={{
          fontSize: '15px',
          color: '#333',
          marginBottom: '15px',
          lineHeight: '1.4'
        }}>
          Your blood donation can help patients suffering from accident injuries, cancer treatments, surgical procedures, and more.
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%'
        }}>
          {['A+', 'B+', 'AB+', 'O+'].map((type, idx) => (
            <div key={type} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: bloodType === type ? 1 : 0.7
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#cc0000',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '13px'
              }}>
                {type}
              </div>
              <div style={{
                height: '4px',
                background: '#cc0000',
                flexGrow: 1,
                opacity: 0.7
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Heart container */}
      <div 
        className="heart-animation-container" 
        style={{ 
          position: 'absolute',
          right: '0',
          top: '0',
          width: '60%', 
          height: '100%',
          cursor: 'pointer'
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <svg 
          viewBox="0 0 200 200" 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${pulseEffect})`,
            width: '280px',
            height: '280px',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))',
            transition: 'transform 0.8s ease'
          }}
        >
          {/* Heart outline */}
          <path 
            d="M100,30 C60,10 0,40 0,100 C0,150 50,180 100,190 C150,180 200,150 200,100 C200,40 140,10 100,30 Z" 
            fill="white"
            stroke="#cc0000"
            strokeWidth="2"
          />
          
          {/* Heart blood fill - animated */}
          <path 
            d="M100,30 C60,10 0,40 0,100 C0,150 50,180 100,190 C150,180 200,150 200,100 C200,40 140,10 100,30 Z" 
            fill="#cc0000"
            opacity="0.9"
            style={{
              clipPath: `polygon(0% 0%, 100% 0%, 100% ${Math.min(50 + animationStep/2, 90)}%, 0% ${Math.min(50 + animationStep/2, 90)}%)`,
              transition: 'clip-path 0.2s ease-in'
            }}
          />
          
          {/* Highlight */}
          <path 
            d="M40,70 C50,40 80,50 100,70 C120,50 150,40 160,70 C165,90 140,100 120,120 L100,140 L80,120 C60,100 35,90 40,70 Z" 
            fill="rgba(255,255,255,0.2)"
          />
          
          {/* Blood droplets */}
          <circle
            cx="100"
            cy={10 + (animationStep % 20)}
            r="3"
            fill="#cc0000"
            opacity={animationStep % 30 < 15 ? 1 : 0}
          />
          
          <circle
            cx="90"
            cy={5 + ((animationStep + 10) % 20)}
            r="2"
            fill="#cc0000"
            opacity={(animationStep + 15) % 30 < 15 ? 1 : 0}
          />
          
          <circle
            cx="110"
            cy={5 + ((animationStep + 20) % 20)}
            r="2"
            fill="#cc0000"
            opacity={(animationStep + 5) % 30 < 15 ? 1 : 0}
          />
        </svg>
        
        {/* Blood Type Label */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fff',
          padding: '5px 20px',
          borderRadius: '20px',
          fontWeight: 'bold',
          fontSize: '24px',
          color: '#cc0000',
          zIndex: 10,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}>
          {bloodType}
        </div>
        
        {/* Animated message */}
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(204, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '20px',
          opacity: isHovering ? 1 : 0.8,
          transition: 'all 0.3s ease',
          fontSize: '14px',
          zIndex: 5,
          textAlign: 'center',
          width: '80%'
        }}>
          One donation can save up to 3 lives
          <div style={{ 
            marginTop: '8px', 
            fontWeight: 'bold',
            borderTop: '1px solid rgba(255,255,255,0.3)',
            paddingTop: '4px'
          }}>
            Donate Blood, Save Lives
          </div>
        </div>
      </div>
    </div>
  );
};

function Home() {
  return (
    <Container className="py-5">
      <Row className="align-items-center mb-5">
        <Col lg={6} className="mb-4 mb-lg-0">
          <h1 className="display-4 fw-bold text-primary">Save Lives with Your Blood Donation</h1>
          <p className="lead my-4">
            Join our community of blood donors and help save lives. Your small action can make a huge difference for someone in need.
          </p>
          <div className="d-flex gap-3 flex-wrap">
            <Button as={Link} to="/register" variant="danger" size="lg">
              Register as Donor
            </Button>
            <Button as={Link} to="/search" variant="outline-danger" size="lg">
              Find Donors
            </Button>
          </div>
        </Col>
        <Col lg={6}>
          <div className="text-center">
            <BloodDonationAnimation />
          </div>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col xs={12} className="text-center mb-4">
          <h2 className="section-title">Why Donate Blood?</h2>
        </Col>
        {[
          { title: "Save Lives", icon: "❤️", text: "A single donation can save up to 3 lives" },
          { title: "Always Needed", icon: "🏥", text: "Every 2 seconds someone needs blood" },
          { title: "Quick & Easy", icon: "⏱️", text: "The donation process takes less than an hour" }
        ].map((item, idx) => (
          <Col md={4} key={idx} className="mb-4">
            <Card className="h-100 text-center p-4 donor-card">
              <Card.Body>
                <div className="display-4 mb-3">{item.icon}</div>
                <Card.Title>{item.title}</Card.Title>
                <Card.Text>{item.text}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        <Col xs={12} className="text-center">
          <h2 className="section-title">Get Started Today</h2>
          <p className="lead mb-4">
            Whether you want to donate blood or find donors, we've got you covered.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Button as={Link} to="/register" variant="danger" size="lg">
              Register as Donor
            </Button>
            <Button as={Link} to="/search" variant="outline-danger" size="lg">
              Find Donors
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
