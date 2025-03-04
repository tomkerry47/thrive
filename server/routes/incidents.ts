import express from 'express';
import { getIncidentByNumber, updateIncident } from '../db';

const router = express.Router();

/**
 * GET /api/incidents/:incidentNumber
 * Get incident details by incident number
 */
router.get('/:incidentNumber', async (req, res) => {
  try {
    const { incidentNumber } = req.params;
    
    if (!incidentNumber) {
      return res.status(400).json({ error: 'Incident number is required' });
    }
    
    const incident = await getIncidentByNumber(incidentNumber);
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    res.json(incident);
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ error: 'Failed to fetch incident details' });
  }
});

/**
 * PUT /api/incidents/:incidentNumber
 * Update incident details
 */
router.put('/:incidentNumber', async (req, res) => {
  try {
    const { incidentNumber } = req.params;
    const updateFields = req.body;
    
    if (!incidentNumber) {
      return res.status(400).json({ error: 'Incident number is required' });
    }
    
    if (!updateFields || Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }
    
    // Get the list of allowed fields from environment variable
    const allowedFields = process.env.INCIDENT_FIELDS?.split(',') || [];
    
    // Filter out any fields that are not in the allowed list
    const filteredFields: Record<string, any> = {};
    Object.entries(updateFields).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        filteredFields[key] = value;
      }
    });
    
    if (Object.keys(filteredFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }
    
    const updatedIncident = await updateIncident(incidentNumber, filteredFields);
    
    if (!updatedIncident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    res.json(updatedIncident);
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ error: 'Failed to update incident details' });
  }
});

export default router;