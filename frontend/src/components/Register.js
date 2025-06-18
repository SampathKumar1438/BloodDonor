import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import axios from 'axios';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bloodGroup: '',
    District: '',
    latitude: null,
    longitude: null
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [geoStatus, setGeoStatus] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
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
      async (position) => {
        const { latitude, longitude } = position.coords;
        const accuracy = position.coords.accuracy;

        console.log(`Location accuracy: ${accuracy} meters`);

        setFormData(prevData => ({
          ...prevData,
          latitude,
          longitude
        }));

        // Enhanced district detection function with prioritized fields and a scoring system
        const findBestDistrictName = (addressData, isPrimary = true) => {
          console.log('Address data:', addressData);
          
          // Priority map for address components (higher number = higher priority)
          const priorityMap = {
            district: 10,
            city_district: 9,
            county: 8,
            suburb: 7,
            sublocality: 7,
            city: 6,
            town: 6,
            locality: 5,
            village: 5,
            neighbourhood: 4,
            state_district: 3,
            state: 2
          };
          
          // Extract all potential district names and assign priorities
          const potentialDistricts = [];
          
          // Check for exact matches in our priority map
          Object.entries(addressData).forEach(([key, value]) => {
            if (value && typeof value === 'string' && value.trim() !== '') {
              const normalizedKey = key.toLowerCase();
              if (priorityMap[normalizedKey]) {
                potentialDistricts.push({
                  name: value,
                  priority: priorityMap[normalizedKey],
                  key: normalizedKey
                });
              } else if (
                normalizedKey.includes('district') ||
                normalizedKey.includes('area') ||
                normalizedKey.includes('region') ||
                normalizedKey.includes('locality') ||
                normalizedKey.includes('location')
              ) {
                potentialDistricts.push({
                  name: value,
                  priority: 3,
                  key: normalizedKey
                });
              }
            }
          });
          
          // Sort potential districts by priority (highest first)
          potentialDistricts.sort((a, b) => b.priority - a.priority);
          
          console.log('Potential districts:', potentialDistricts);
          
          // Return the highest priority match if any exists
          if (potentialDistricts.length > 0) {
            // Primary sources get returned directly
            if (isPrimary) {
              return potentialDistricts[0].name;
            } 
            
            // For secondary sources, prefer district/county/city names
            const highPriorityDistrict = potentialDistricts.find(d => d.priority >= 6);
            if (highPriorityDistrict) {
              return highPriorityDistrict.name;
            }
            
            return potentialDistricts[0].name;
          }
          
          // If nothing matched but we have a display name, try to extract from it
          if (addressData.display_name) {
            const parts = addressData.display_name.split(', ');
            if (parts.length >= 2) {
              return parts[0] || parts[1]; 
            }
          }
          
          return '';
        };
        
        // Store candidate districts from different sources for later comparison
        const districtCandidates = [];

        try {
          // First try the HERE Maps API
          try {
            const hereResponse = await axios.get(
              `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&lang=en-US&limit=10`
            );

            console.log('HERE Maps response:', hereResponse.data);

            if (hereResponse.data?.items?.length > 0) {
              // Process all available items to get more options
              for (let i = 0; i < Math.min(hereResponse.data.items.length, 5); i++) {
                const item = hereResponse.data.items[i];
                const address = item.address;
                
                // Extract all potential district values
                const district = address.district || address.county || address.city || address.subdistrict;
                
                if (district && district.trim() !== '') {
                  districtCandidates.push({
                    name: district,
                    source: 'HERE Maps',
                    priority: i === 0 ? 10 : 8, // Give highest priority to first result
                    distance: item.distance || 0
                  });
                }
              }
            }
          } catch (hereError) {
            console.log('Here Maps geocoding error:', hereError);
          }

          // Then try OpenStreetMap with different zoom levels for more precise results
          try {
            // Try different zoom levels to get the most precise district
            // 18: Building, 16: Street, 14: Suburb, 12: City/Town, 10: District, 8: County, 6: State
            const zoomLevels = [16, 14, 12, 10, 8];
            
            for (const zoom of zoomLevels) {
              const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=${zoom}&addressdetails=1&accept-language=en&namedetails=1`,
                {
                  headers: {
                    'User-Agent': 'BloodDonorApp/1.0'
                  }
                }
              );

              console.log(`OpenStreetMap response (zoom=${zoom}):`, response.data);

              if (response.data?.address) {
                const candidateDistrict = findBestDistrictName(response.data.address);
                if (candidateDistrict && candidateDistrict.trim() !== '') {
                  districtCandidates.push({
                    name: candidateDistrict,
                    source: `OSM (zoom=${zoom})`,
                    priority: 9 - (zoomLevels.indexOf(zoom)), // Higher priority for more precise zoom levels
                    distance: 0 // We don't have distance info for OSM
                  });
                }
              }
              
              // Also check the display name if we haven't found a good district
              if (response.data?.display_name && districtCandidates.length === 0) {
                const parts = response.data.display_name.split(', ');
                if (parts.length >= 2) {
                  const displayNameDistrict = parts[0] || parts[1];
                  districtCandidates.push({
                    name: displayNameDistrict,
                    source: `OSM Display Name (zoom=${zoom})`,
                    priority: 5,
                    distance: 0
                  });
                }
              }
            }
          } catch (osmError) {
            console.error('OpenStreetMap error:', osmError);

            // Try Google Maps API as a fallback
            try {
              const googleResponse = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=administrative_area_level_2|sublocality|locality|neighborhood&language=en`
              );

              console.log('Google Maps response:', googleResponse.data);

              if (googleResponse.data.status === "OK" && googleResponse.data.results.length > 0) {
                // Try multiple results to get more options
                for (let i = 0; i < Math.min(googleResponse.data.results.length, 5); i++) {
                  const result = googleResponse.data.results[i];
                  
                  if (result.address_components?.length > 0) {
                    // Try multiple component types in order of precision
                    const types = [
                      'sublocality_level_1',
                      'locality',
                      'administrative_area_level_2',
                      'administrative_area_level_3',
                      'neighborhood',
                      'sublocality'
                    ];

                    for (const type of types) {
                      const component = result.address_components.find(comp =>
                        comp.types.includes(type)
                      );

                      if (component) {
                        districtCandidates.push({
                          name: component.long_name,
                          source: `Google Maps (${type})`,
                          priority: 9 - (types.indexOf(type) * 0.5) - (i * 0.5), // Higher priority for more precise types and earlier results
                          distance: 0 // We don't have distance info
                        });
                      }
                    }
                  }

                  // If we couldn't extract components, try the formatted address
                  if (result.formatted_address && districtCandidates.length === 0) {
                    const district = result.formatted_address.split(',')[0];
                    districtCandidates.push({
                      name: district,
                      source: 'Google Formatted Address',
                      priority: 5,
                      distance: 0
                    });
                  }
                }
              }
            } catch (googleError) {
              console.error('Google Maps error:', googleError);
            }

            // Try BigDataCloud API as another fallback
            try {
              const bigDataCloudResponse = await axios.get(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
                
              console.log('BigDataCloud response:', bigDataCloudResponse.data);
                
              if (bigDataCloudResponse.data) {
                const data = bigDataCloudResponse.data;
                // Try multiple fields in priority order
                const district = data.locality || data.city || data.principalSubdivision;
                  
                if (district) {
                  districtCandidates.push({
                    name: district,
                    source: 'BigDataCloud',
                    priority: 6,
                    distance: 0
                  });
                }
              }            } catch (bdcError) {
              console.error('BigDataCloud error:', bdcError);
            }
          }
          
          // Analyze all collected district candidates
          console.log('All district candidates:', districtCandidates);
          
          // Find the best district based on priority and frequency
          let finalDistrict = '';
          
          if (districtCandidates.length > 0) {
            // Sort by priority (highest first)
            districtCandidates.sort((a, b) => b.priority - a.priority);
            
            // Count occurrences of each district name (ignoring case)
            const districtCounts = {};
            districtCandidates.forEach(candidate => {
              const normalizedName = candidate.name.toLowerCase();
              districtCounts[normalizedName] = (districtCounts[normalizedName] || 0) + 1;
            });
            
            console.log('District counts:', districtCounts);
            
            // Find the district that appears most frequently
            let mostFrequent = '';
            let highestCount = 0;
            
            Object.entries(districtCounts).forEach(([name, count]) => {
              if (count > highestCount) {
                highestCount = count;
                mostFrequent = name;
              }
            });
            
            // If we have a district that appears in multiple sources, use that
            if (highestCount > 1) {
              finalDistrict = districtCandidates.find(
                c => c.name.toLowerCase() === mostFrequent
              ).name;
            } else {
              // Otherwise, use the highest priority one
              finalDistrict = districtCandidates[0].name;
            }
            
            console.log('Final selected district:', finalDistrict);
            
            setFormData(prevData => ({
              ...prevData,
              District: finalDistrict,
              latitude,
              longitude
            }));
            setGeoStatus(`Location fetched successfully: ${finalDistrict}`);
          } else {
            setGeoStatus('Location coordinates retrieved, but could not determine precise district');
          }
        } catch (error) {
          console.error('Error getting district:', error);
          setGeoStatus('Location coordinates retrieved, but could not determine district');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to retrieve your location. ';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Try again or enter district manually.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'An unknown error occurred. Please try again.';
        }

        setGeoStatus(errorMessage);
      },
      geoOptions
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!formData.latitude || !formData.longitude) {
      setError('Please fetch your location by clicking the "Get My Location" button');
      setLoading(false);
      return;
    }

    if (!formData.District) {
      try {
        await getLocation();
        if (!formData.District) {
          setError('Could not determine your district. Please enter it manually before submitting.');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching location:', err);
      }
    }

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/register`;
      await axios.post(apiUrl, formData, {
        headers: { 'Content-Type': 'application/json' }
      });

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        bloodGroup: '',
        District: '',
        latitude: null,
        longitude: null
      });
      setGeoStatus('');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm form-container">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Register as a Blood Donor</h2>

              {success && <Alert variant="success">Registration successful!</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Blood Group</Form.Label>
                      <Form.Select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Blood Group</option>
                        {bloodGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>District</Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type="text"
                          name="District"
                          value={formData.District}
                          onChange={handleChange}
                          placeholder="location"
                          className={formData.latitude && !formData.District ? "border-warning" : ""}
                        />
                        {formData.District && (
                          <Button
                            variant="outline-secondary"
                            onClick={() => setFormData(prev => ({ ...prev, District: '' }))}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                      {formData.latitude && !formData.District && (
                        <Form.Text className="text-warning">
                          <i className="bi bi-exclamation-triangle"></i> Could not automatically detect your district. 
                          Please enter your district manually, or try clicking "Try Again".
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Label>
                      <span className="text-danger">*</span> Location
                      <span className="ms-2 text-danger fw-bold">(Required)</span>
                    </Form.Label>
                    <div>
                      {formData.latitude && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="me-2"
                          onClick={getLocation}
                          disabled={loading}
                        >
                          Try Again
                        </Button>
                      )}
                      <Button
                        variant={formData.latitude ? "success" : "primary"}
                        onClick={getLocation}
                        disabled={loading}
                      >
                        {formData.latitude ? "✓ Location Fetched" : "Get My Location"}
                      </Button>
                    </div>
                  </div>
                  {geoStatus && (
                    <Alert
                      variant={
                        geoStatus.includes("successfully")
                          ? "success"
                          : geoStatus.includes("could not determine")
                            ? "warning"
                            : "info"
                      }
                      className="mt-2"
                    >
                      {geoStatus}
                    </Alert>
                  )}
                  {formData.latitude && formData.longitude && (
                    <div className="text-muted small mt-2">
                      <div>Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</div>
                      {!formData.District && (
                        <div className="text-warning mt-1">
                          <small>
                            <i className="bi bi-exclamation-triangle"></i> District could not be automatically determined.
                            Please enter it manually above.
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                </Form.Group>

                <div className="d-grid">
                  <Button variant="danger" type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Register;
