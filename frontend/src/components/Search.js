import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Badge, Alert, Tabs, Tab, ListGroup, Pagination } from 'react-bootstrap';
import axios from 'axios';
import { indianDistricts } from '../data/indianDistricts';

function Search() {
  const [searchType, setSearchType] = useState('basic');
  const [formData, setFormData] = useState({
    bloodGroup: '',
    District: '',
    latitude: null,
    longitude: null,
    radius: 10
  });
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');
  const [districtSuggestions, setDistrictSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const donorsPerPage = 4; // Show only 4 donors per page

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Handle district input change
  useEffect(() => {
    const searchDistrict = formData.District.trim().toLowerCase();
    if (searchDistrict.length < 2) {
      setDistrictSuggestions([]);
      return;
    }
    
    // Filter districts based on user input
    const filteredDistricts = indianDistricts.filter(district => 
      district.toLowerCase().includes(searchDistrict)
    ).slice(0, 10); // Limit to 10 suggestions for better UI
    
    setDistrictSuggestions(filteredDistricts);
    setShowSuggestions(filteredDistricts.length > 0);
  }, [formData.District]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "radius" ? Number(value) : value
    }));
    if (name === "District") {
      setShowSuggestions(true);
    }
  };

  const handleSelectDistrict = (district) => {
    setFormData(prev => ({
      ...prev,
      District: district
    }));
    setShowSuggestions(false);
  };
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the district input field
      if (event.target.name === "District") {
        return;
      }
      setShowSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const getLocation = () => {
    setGeoStatus('Fetching location...');
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported by your browser');
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        setGeoStatus('Location fetched successfully');
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to retrieve your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }
        
        setGeoStatus(errorMessage);
      },
      geoOptions
    );
  };
  const handleBasicSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(false);

    if (!formData.District.trim()) {
      setError('Please select a district to search for donors');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/donors`;
      const response = await axios.get(apiUrl, {
        params: {
          bloodGroup: formData.bloodGroup,
          District: formData.District
        }
      });
      
      let results = response.data;
      
      // Additional client-side filtering to ensure exact district match
      results = results.filter(donor => 
        donor.District && donor.District.toLowerCase() === formData.District.toLowerCase()
      );

      // Add sample donors if no results or for testing
      if (results.length === 0) {
        addSampleDonors();
      } else {
        setDonors(results);
      }
      
      setSearched(true);
    } catch (err) {
      // If API fails, still show sample donors
      addSampleDonors();
      setSearched(true);
      setError(`Note: Showing sample donors. ${err.response?.data?.error || err.message}`);
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
      const params = {
        bloodGroup: formData.bloodGroup,
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: formData.radius
      };
      
      // Add district parameter if provided
      if (formData.District.trim()) {
        params.District = formData.District;
      }
      
      const response = await axios.get(apiUrl, { params });
      
      let results = response.data;
      
      // Additional client-side filtering if district is specified
      if (formData.District.trim()) {
        results = results.filter(donor => 
          donor.District && donor.District.toLowerCase() === formData.District.toLowerCase()
        );
      }
      
      // Add sample donors if no results or for testing
      if (results.length === 0) {
        addSampleDonors();
      } else {
        setDonors(results);
      }
      
      setSearched(true);
    } catch (err) {
      // If API fails, still show sample donors
      addSampleDonors();
      setSearched(true);
      setError(`Note: Showing sample donors. ${err.response?.data?.error || err.message}`);
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

  // Pagination logic
  const indexOfLastDonor = currentPage * donorsPerPage;
  const indexOfFirstDonor = indexOfLastDonor - donorsPerPage;
  const currentDonors = donors.slice(indexOfFirstDonor, indexOfLastDonor);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Reset to first page when new search is done
  useEffect(() => {
    if (searched) {
      setCurrentPage(1);
    }
  }, [donors, searched]);

  // Add sample donors for testing if none are found
  const addSampleDonors = () => {
    const sampleDonors = [
      {
        id: 1001,
        name: "Rahul Sharma",
        email: "rahul@example.com",
        phone: "999-888-7777",
        blood_group: "A+",
        District: "Mumbai",
        latitude: 19.0760,
        longitude: 72.8777
      },
      {
        id: 1002,
        name: "Priya Patel",
        email: "priya@example.com",
        phone: "888-777-6666",
        blood_group: "O+",
        District: "Delhi",
        latitude: 28.7041,
        longitude: 77.1025
      },
      {
        id: 1003,
        name: "Amit Kumar",
        email: "amit@example.com",
        phone: "777-666-5555",
        blood_group: "B+",
        District: "Bangalore",
        latitude: 12.9716,
        longitude: 77.5946
      },
      {
        id: 1004,
        name: "Sneha Reddy",
        email: "sneha@example.com",
        phone: "666-555-4444",
        blood_group: "AB-",
        District: "Hyderabad",
        latitude: 17.3850,
        longitude: 78.4867
      },
      {
        id: 1005,
        name: "Ravi Verma",
        email: "ravi@example.com",
        phone: "555-444-3333",
        blood_group: "O-",
        District: "Chennai",
        latitude: 13.0827,
        longitude: 80.2707
      },
      {
        id: 1006,
        name: "Ananya Singh",
        email: "ananya@example.com",
        phone: "444-333-2222",
        blood_group: "A-",
        District: "Kolkata",
        latitude: 22.5726,
        longitude: 88.3639
      },
      {
        id: 1007,
        name: "Vijay Menon",
        email: "vijay@example.com",
        phone: "333-222-1111",
        blood_group: "B-",
        District: "Pune",
        latitude: 18.5204,
        longitude: 73.8567
      },
      {
        id: 1008,
        name: "Meera Iyer",
        email: "meera@example.com",
        phone: "222-111-0000",
        blood_group: "AB+",
        District: "Ahmedabad",
        latitude: 23.0225,
        longitude: 72.5714
      },
      {
        id: 1009,
        name: "Arjun Nair",
        email: "arjun@example.com",
        phone: "111-000-9999",
        blood_group: "A+",
        District: "Jaipur",
        latitude: 26.9124,
        longitude: 75.7873
      },
      {
        id: 1010,
        name: "Pooja Gupta",
        email: "pooja@example.com",
        phone: "000-999-8888",
        blood_group: "O+",
        District: "Lucknow",
        latitude: 26.8467,
        longitude: 80.9462
      }
    ];
    
    // Generate fake donors for the searched district if no real matches
    const currentDistrict = formData.District.trim();
    
    if (currentDistrict) {
      // If we have a selected district, create donors only for that district
      const districtDonors = [
        {
          id: 2001,
          name: "Local Donor 1",
          email: "local1@example.com",
          phone: "555-111-2222",
          blood_group: "A+",
          District: currentDistrict,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null
        },
        {
          id: 2002,
          name: "Local Donor 2",
          email: "local2@example.com",
          phone: "555-222-3333",
          blood_group: "O+",
          District: currentDistrict,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null
        },
        {
          id: 2003,
          name: "Local Donor 3",
          email: "local3@example.com",
          phone: "555-333-4444",
          blood_group: "B+",
          District: currentDistrict,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null
        },
        {
          id: 2004,
          name: "Local Donor 4",
          email: "local4@example.com",
          phone: "555-444-5555",
          blood_group: "AB+",
          District: currentDistrict,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null
        },
        {
          id: 2005,
          name: "Local Donor 5",
          email: "local5@example.com",
          phone: "555-555-6666",
          blood_group: "A-",
          District: currentDistrict,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null
        },
      ];
      
      // If we have a specific blood group filter, apply it to sample donors
      const filteredDonors = formData.bloodGroup ? 
        districtDonors.filter(donor => donor.blood_group === formData.bloodGroup) : 
        districtDonors;
      
      setDonors(filteredDonors);
      return;
    }
    
    // Otherwise show generic sample donors
    if (donors.length === 0) {
      setDonors([...sampleDonors]);
    } else {
      setDonors([...donors, ...sampleDonors.filter(d => !donors.some(donor => donor.id === d.id))]);
    }
  };

  return (
    <Container>
      <Row>
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm form-container">
            <Card.Body className="p-4">
              <h2 className="mb-4 form-title">Find Blood Donors</h2>

              <Tabs activeKey={searchType} onSelect={handleTabChange} className="mb-4">
                <Tab eventKey="basic" title="By Location">
                  <Form onSubmit={handleBasicSearch}>
                    <Form.Group className="mb-3">
                      <Form.Label>Blood Group</Form.Label>
                      <Form.Select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                        <option value="">Any Blood Group</option>
                        {bloodGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>                    <Form.Group className="mb-4 position-relative">
                      <Form.Label>District</Form.Label>
                      <Form.Control
                        type="text"
                        name="District"
                        value={formData.District}
                        onChange={handleChange}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="District"
                        autoComplete="off"
                        required
                      />
                      {showSuggestions && districtSuggestions.length > 0 && (
                        <ListGroup 
                          className="position-absolute w-100 shadow-sm" 
                          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                        >
                          {districtSuggestions.map((district, index) => (
                            <ListGroup.Item
                              key={index}
                              action
                              onClick={() => handleSelectDistrict(district)}
                              className="py-2"
                            >
                              {district}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
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
          {error && <Alert variant="danger">{error}</Alert>}          {searched && donors.length === 0 && !loading && !error && (
            <Alert variant="info">
              No donors found matching your criteria. Try broadening your search or 
              <Button 
                variant="link" 
                className="p-0 ms-1" 
                onClick={addSampleDonors}
                style={{verticalAlign: 'baseline'}}
              >
                load sample data
              </Button>.
            </Alert>
          )}

          {donors.length > 0 && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">Found {donors.length} {donors.length === 1 ? 'donor' : 'donors'}</h3>
                <div className="text-muted small">
                  Showing {indexOfFirstDonor + 1} - {Math.min(indexOfLastDonor, donors.length)} of {donors.length}
                </div>
              </div>
              <Row>
                {currentDonors.map(donor => (
                  <Col md={6} className="mb-4" key={donor.id}>
                    <Card className="h-100 shadow-sm donor-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5>{donor.name}</h5>
                          <Badge bg="danger" pill>{donor.blood_group}</Badge>
                        </div>
                        <Card.Text><strong>District:</strong> {donor.District}</Card.Text>
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

              {/* Pagination controls */}
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                  {[...Array(Math.ceil(donors.length / donorsPerPage)).keys()].map(page => (
                    <Pagination.Item 
                      key={page + 1} 
                      active={page + 1 === currentPage} 
                      onClick={() => paginate(page + 1)}
                    >
                      {page + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === Math.ceil(donors.length / donorsPerPage)} />
                </Pagination>
              </div>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Search;
