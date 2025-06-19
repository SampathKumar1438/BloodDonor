import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { indianDistricts } from '../data/indianDistricts';

// Function to find the closest matching district from our standardized list

const findMatchingDistrict = (detectedDistrict) => {  if (!detectedDistrict) return '';
  // Normalize the detected district
  const normalizedDetected = detectedDistrict.toLowerCase().trim();

  // Check if there's a comma-separated address format (e.g., "District, State")
  const parts = detectedDistrict.split(',').map(part => part.trim());
  if (parts.length > 1) {
    // Check if first part is a district name directly
    const potentialDistrict = parts[0];
    const exactMatchFirstPart = indianDistricts.find(
      district => district.toLowerCase() === potentialDistrict.toLowerCase()
    );
    if (exactMatchFirstPart) return exactMatchFirstPart;
  }
  
  // First try for exact matches
  const exactMatch = indianDistricts.find(
    district => district.toLowerCase() === normalizedDetected
  );
  
  if (exactMatch) return exactMatch;
  
  // Try for district names that contain the detected name
  const containsMatch = indianDistricts.find(
    district => district.toLowerCase().includes(normalizedDetected)
  );
  
  if (containsMatch) return containsMatch;
  
  // Try for detected names that contain district names
  const matchingDistricts = indianDistricts.filter(
    district => normalizedDetected.includes(district.toLowerCase())
  );
  
  if (matchingDistricts.length > 0) {
    // Sort by length (descending) to get the most specific match
    matchingDistricts.sort((a, b) => b.length - a.length);
    return matchingDistricts[0];
  }

  
  // Use enhanced similarity calculation with Levenshtein distance for fuzzy matching
  let bestMatch = '';
  let highestScore = 0;
  
  // Calculate Levenshtein distance between two strings
  const levenshteinDistance = (str1, str2) => {
    const track = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    return track[str2.length][str1.length];
  };
  
  // Calculate similarity score based on Levenshtein distance
  const calculateSimilarity = (s1, s2) => {
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1; // Both strings are empty
    
    const distance = levenshteinDistance(s1.toLowerCase(), s2.toLowerCase());
    return 1 - (distance / maxLen);
  };
  
  // Find best match using similarity score
  for (const district of indianDistricts) {
    const similarityScore = calculateSimilarity(normalizedDetected, district.toLowerCase());
    if (similarityScore > highestScore) {
      highestScore = similarityScore;
      bestMatch = district;
    }
  }
  
  // Return the best match if the score is above the threshold (0.6), otherwise return detected district
  return highestScore > 0.6 ? bestMatch : detectedDistrict;
};

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
  const [districtSuggestions, setDistrictSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    if (name === "District") {
      setShowSuggestions(true);
    }
  };

  const handleSelectDistrict = (district) => {
    setFormData(prevData => ({
      ...prevData,
      District: district
    }));
    setShowSuggestions(false);
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
        let matchedDistrict = ''; // Add declaration for matchedDistrict variable

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
              }
            } catch (bdcError) {
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
              console.log('Detected district:', finalDistrict);
              
            // Try direct match with our district list first
            const directMatch = indianDistricts.find(
              district => district.toLowerCase() === finalDistrict.toLowerCase()
            );
            
            if (directMatch) {
              matchedDistrict = directMatch;
              console.log('Direct match found with standard district list:', matchedDistrict);
            } else {
              // Try to get full address for better district matching
              // eslint-disable-next-line no-unused-vars
              let fullAddress = '';
              
              try {
                // Get detailed address from OpenCage API (more reliable for Indian addresses)
                const opencageResponse = await axios.get(
                  `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=4d43d481d9a742eabb7a803a5a3bac64&language=en&no_annotations=1`
                );
                
                console.log('OpenCage response:', opencageResponse.data);
                
                if (opencageResponse.data?.results?.length > 0) {
                  const result = opencageResponse.data.results[0];
                  // eslint-disable-next-line no-unused-vars
                  const fullAddress = result.formatted;
                  
                  const components = result.components;
                  
                  // Extract district from components if available
                  if (components.county || components.district || components.city_district) {
                    const districtName = components.county || components.district || components.city_district || components.city;
                    
                    if (districtName) {
                      districtCandidates.push({
                        name: districtName,
                        source: 'OpenCage',
                        priority: 12, // Give highest priority to OpenCage
                        distance: 0
                      });
                      
                      finalDistrict = districtName;
                    }
                  }
                }
              } catch (opencageError) {
                console.error('OpenCage error:', opencageError);
              }
              
              // If we have a potential district name from geocoding services
              matchedDistrict = findMatchingDistrict(finalDistrict);
              console.log('Matched district with standardized list:', matchedDistrict);
              
              // If we still don't have a match, try one more service - Google Maps Geocoding API as a last resort
              if (!matchedDistrict || matchedDistrict === finalDistrict) {
                try {
                  console.log("Trying Google Maps API as fallback for district...");
                  // Using a different API key (limited usage)
                  const googleApiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=administrative_area_level_2&key=AIzaSyBVF16SZ1h2qU8l5UlDPasmOwnavVUmWpM`;
                  const googleResponse = await axios.get(googleApiUrl);
                  
                  if (googleResponse.data.results && googleResponse.data.results.length > 0) {
                    const adminArea = googleResponse.data.results[0];
                    
                    // Extract district name from address components
                    for (const component of adminArea.address_components) {
                      if (component.types.includes('administrative_area_level_2')) {
                        finalDistrict = component.long_name;
                        matchedDistrict = findMatchingDistrict(finalDistrict);
                        console.log("Google found district:", finalDistrict, "Matched:", matchedDistrict);
                        break;
                      }
                    }
                  }
                } catch (googleError) {
                  console.error("Google Maps API error:", googleError);
                }
              }
              
              // Make one more attempt with fuzzy matching at higher threshold
              if (!matchedDistrict || matchedDistrict === finalDistrict) {
                // Use Levenshtein distance with a higher threshold for better matching
                let bestMatch = '';
                let highestSimilarity = 0;
                
                for (const district of indianDistricts) {
                  const similarity = calculateSimilarity(finalDistrict.toLowerCase(), district.toLowerCase());
                  if (similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                    bestMatch = district;
                  }
                }
                
                if (highestSimilarity > 0.7) { // Higher threshold for fuzzy matching
                  matchedDistrict = bestMatch;
                  console.log(`Fuzzy matched ${finalDistrict} to ${matchedDistrict} with score ${highestSimilarity}`);
                }
              }
            }
            
            // Validate matchedDistrict is actually in our list
            const isValidDistrict = indianDistricts.includes(matchedDistrict);
            
            setFormData(prevData => ({
              ...prevData,
              District: isValidDistrict ? matchedDistrict : '',
              latitude,
              longitude
            }));
            
            if (isValidDistrict) {
              setGeoStatus(`Location fetched successfully: ${matchedDistrict}`);
            } else {
              // Clear district and prompt user to select manually
              setGeoStatus(`Location detected as "${finalDistrict}" but couldn't match to a standard district. Please select manually.`);
            }
          } else {
            setGeoStatus('Location coordinates retrieved, but could not determine precise district');
            setFormData(prevData => ({
              ...prevData,
              District: '',
              latitude,
              longitude
            }));
          }
        } catch (error) {
          console.error('Error getting district:', error);
          setGeoStatus('Location coordinates retrieved, but could not determine district');
        }
        
        // Helper function for Levenshtein similarity calculation
        function calculateSimilarity(s1, s2) {
          const maxLen = Math.max(s1.length, s2.length);
          if (maxLen === 0) return 1; // Both strings are empty
          
          const distance = levenshteinDistance(s1, s2);
          return 1 - (distance / maxLen);
        }
        
        // Levenshtein distance calculation
        function levenshteinDistance(str1, str2) {
          const m = str1.length;
          const n = str2.length;
          const dp = Array(m+1).fill().map(() => Array(n+1).fill(0));
          
          for (let i = 0; i <= m; i++) dp[i][0] = i;
          for (let j = 0; j <= n; j++) dp[0][j] = j;
          
          for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
              const cost = str1[i-1] === str2[j-1] ? 0 : 1;
              dp[i][j] = Math.min(
                dp[i-1][j] + 1,      // deletion
                dp[i][j-1] + 1,      // insertion
                dp[i-1][j-1] + cost  // substitution
              );
            }
          }
          
          return dp[m][n];
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
    }    if (!formData.District) {
      try {
        await getLocation();
        if (!formData.District) {
          setError('Could not determine your district. Please enter it manually before submitting.');
          setLoading(false);
          return;
        }
      } catch (err) {
        setError('Could not determine your district. Please enter it manually before submitting.');
        setLoading(false);
        return;
      }
    }

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/register`;
      // eslint-disable-next-line no-unused-vars
      const response = await axios.post(apiUrl, formData);
      
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
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col lg={8} md={10}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <h2 className="mb-4">Register as a Blood Donor</h2>
              
              {success && (
                <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                  <Alert.Heading>Registration Successful!</Alert.Heading>
                  <p>Thank you for registering as a blood donor. Your information has been added to our database.</p>
                </Alert>
              )}

              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  <Alert.Heading>Registration Error</Alert.Heading>
                  <p>{error}</p>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
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
                  </Col>

                  <Col md={6}>
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
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
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
                  </Col>

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
                        ))}                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 position-relative">
                      <Form.Label>District</Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type="text"
                          name="District"
                          value={formData.District}
                          onChange={handleChange}
                          onClick={(e) => e.stopPropagation()}                          placeholder="Start typing to see suggestions"
                          autoComplete="off"
                          className={formData.latitude && !formData.District ? "border-warning" : ""}
                        />
                        {formData.District && (
                          <Button
                            variant="outline-secondary"
                            onClick={() => setFormData(prev => ({ ...prev, District: '' }))}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      {showSuggestions && districtSuggestions.length > 0 && (
                        <ListGroup 
                          className="position-absolute w-100 shadow-sm mt-1" 
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
                      <strong>Your Location</strong>
                      <div className="small text-muted">
                        This helps nearby blood recipients find you
                      </div>
                    </Form.Label>
                    <Button
                      variant="outline-primary"
                      onClick={getLocation}
                      disabled={loading}
                      type="button"
                    >
                      {formData.latitude ? "Try Again" : "Get My Location"}
                    </Button>
                  </div>
                  {geoStatus && (
                    <Alert 
                      variant={geoStatus.includes('successfully') ? 'success' : 'info'} 
                      className="mt-2 py-2"
                    >
                      {geoStatus}
                    </Alert>
                  )}
                  {formData.latitude && formData.longitude && (
                    <div className="text-muted small">
                      Your coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </div>
                  )}
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="danger" 
                    size="lg" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register as Donor'}
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
