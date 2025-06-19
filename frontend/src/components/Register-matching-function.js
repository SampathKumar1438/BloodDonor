import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { indianDistricts } from '../data/indianDistricts';

// Function to find the closest matching district from our standardized list
const findMatchingDistrict = (detectedDistrict) => {
  if (!detectedDistrict) return '';
  
  // Normalize the detected district
  const normalizedDetected = detectedDistrict.toLowerCase().trim();
  
  // Check if the detected district contains state name and try to extract district
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", 
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
  ];
  
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
  
  // Use enhanced similarity calculation
  let bestMatch = '';
  let highestScore = 0;
  
  // Function to calculate Levenshtein distance (edit distance)
  const calculateLevenshtein = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i-1) === a.charAt(j-1)) {
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i-1][j-1] + 1, // substitution
            Math.min(
              matrix[i][j-1] + 1, // insertion
              matrix[i-1][j] + 1  // deletion
            )
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  };
  
  indianDistricts.forEach(district => {
    const districtLower = district.toLowerCase();
    
    // Calculate edit distance
    const distance = calculateLevenshtein(normalizedDetected, districtLower);
    
    // Calculate similarity score (inversely related to distance)
    const maxLength = Math.max(normalizedDetected.length, districtLower.length);
    const score = 1 - (distance / maxLength);
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = district;
    }
  });
  
  // Only return best match if the similarity is high enough
  return highestScore > 0.6 ? bestMatch : detectedDistrict;
};
