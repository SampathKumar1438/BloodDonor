import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Badge, Alert, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';

function Search() {
  const [searchType, setSearchType] = useState('basic');
  const [formData, setFormData] = useState({
    bloodGroup: '',
    city: '',
    latitude: null,
    longitude: null,
    radius: 10
  });

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "radius" ? Number(value) : value
    }));
  };

  const getLocation = () => {
    setGeoStatus('Fetching location...');
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setGeoStatus('Location fetched successfully');
      },
      () => {
        setGeoStatus('Unable to retrieve your location');
      }
    );
  };

  const handleBasicSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(false);

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/donors`;
      const response = await axios.get(apiUrl, {
        params: {
          bloodGroup: formData.bloodGroup,
          city: formData.city
        }
      });
      setDonors(response.data);
      setSearched(true);
    } catch (err) {
      setError(`Failed to fetch donors: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGeoSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(false);

    if (!formData.latitude || !formData.longitude) {
      setError('Please share your location first');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/donors/nearby`;
      const response = await axios.get(apiUrl, {
        params: {
          bloodGroup: formData.bloodGroup,
          latitude: formData.latitude,
          longitude: formData.longitude,
          radius: formData.radius
        }
      });
      setDonors(response.data);
      setSearched(true);
    } catch (err) {
      setError(`Failed to fetch nearby donors: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setSearchType(key);
    setDonors([]);
    setSearched(false);
    setError('');
  };

  return (
    <Container>
      <Row>
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm form-container">
            <Card.Body className="p-4">
              <h2 className="mb-4 form-title">Find Blood Donors</h2>

              <Tabs activeKey={searchType} onSelect={handleTabChange} className="mb-4">
                <Tab eventKey="basic" title="By City">
                  <Form onSubmit={handleBasicSearch}>
                    <Form.Group className="mb-3">
                      <Form.Label>Blood Group</Form.Label>
                      <Form.Select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                        <option value="">Any Blood Group</option>
                        {bloodGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>

                    <div className="d-grid">
                      <Button variant="danger" type="submit" disabled={loading}>
                        {loading ? 'Searching...' : 'Search Donors'}
                      </Button>
                    </div>
                  </Form>
                </Tab>

                <Tab eventKey="geo" title="Near Me">
                  <Form onSubmit={handleGeoSearch}>
                    <Form.Group className="mb-3">
                      <Form.Label>Blood Group</Form.Label>
                      <Form.Select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                        <option value="">Any Blood Group</option>
                        {bloodGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <Form.Label>Your Location</Form.Label>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={getLocation}
                          disabled={loading}
                        >
                          Share My Location
                        </Button>
                      </div>
                      {geoStatus && <Alert variant="info" className="mt-2 py-1 px-2">{geoStatus}</Alert>}
                      {formData.latitude && formData.longitude && (
                        <div className="text-muted small mt-2">
                          Your coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                        </div>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Search Radius (km)</Form.Label>
                      <Form.Range
                        name="radius"
                        min="1"
                        max="50"
                        value={formData.radius}
                        onChange={handleChange}
                      />
                      <div className="d-flex justify-content-between">
                        <small>1 km</small>
                        <small className="fw-bold">{formData.radius} km</small>
                        <small>50 km</small>
                      </div>
                    </Form.Group>

                    <div className="d-grid">
                      <Button
                        variant="danger"
                        type="submit"
                        disabled={loading || !formData.latitude}
                      >
                        {loading ? 'Searching...' : 'Search Nearby Donors'}
                      </Button>
                    </div>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {error && <Alert variant="danger">{error}</Alert>}

          {searched && donors.length === 0 && !loading && !error && (
            <Alert variant="info">
              No donors found matching your criteria. Try broadening your search.
            </Alert>
          )}

          {donors.length > 0 && (
            <>
              <h3 className="mb-3">Found {donors.length} {donors.length === 1 ? 'donor' : 'donors'}</h3>
              <Row>
                {donors.map(donor => (
                  <Col md={6} className="mb-4" key={donor.id}>
                    <Card className="h-100 shadow-sm donor-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5>{donor.name}</h5>
                          <Badge bg="danger" pill>{donor.blood_group}</Badge>
                        </div>
                        <Card.Text><strong>City:</strong> {donor.city}</Card.Text>
                        {donor.distance && <Card.Text><strong>Distance:</strong> {donor.distance} km</Card.Text>}
                        <hr className="my-2" />
                        <div className="d-flex gap-2 mt-3">
                          <Button variant="outline-success" size="sm" href={`tel:${donor.phone}`}>📞 Call</Button>
                          <Button variant="outline-primary" size="sm" href={`mailto:${donor.email}`}>✉️ Email</Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Search;
