import * as sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// SQL Server configuration
const sqlConfig: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER || '',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // For Azure SQL
    trustServerCertificate: false // Change to true for local dev / self-signed certs
  }
};

// Create a connection pool
const pool = new sql.ConnectionPool(sqlConfig);
const poolConnect = pool.connect();

// Handle connection errors
poolConnect.catch(err => {
  console.error('Error connecting to SQL Server:', err);
});

/**
 * Get incident details by incident number
 * @param incidentNumber The incident number to look up
 * @returns The incident details or null if not found
 */
export async function getIncidentByNumber(incidentNumber: string): Promise<any> {
  try {
    await poolConnect;
    
    // Get the list of fields to retrieve from environment variable
    const fieldsToRetrieve = process.env.INCIDENT_FIELDS?.split(',') || [];
    
    // Build the SQL query dynamically based on the fields
    const fieldsString = fieldsToRetrieve.length > 0 
      ? fieldsToRetrieve.join(', ') 
      : '*'; // Fallback to all fields if none specified
    
    // Get table name from environment variable or use default
    const tableName = process.env.DB_TABLE_NAME || 'Incidents';
    
    const result = await pool.request()
      .input('incidentNumber', sql.VarChar, incidentNumber)
      .query(`SELECT ${fieldsString} FROM ${tableName} WHERE IncidentNumber = @incidentNumber`);
    
    return result.recordset[0] || null;
  } catch (err) {
    console.error('SQL error:', err);
    throw err;
  }
}

/**
 * Update incident details
 * @param incidentNumber The incident number to update
 * @param fields Object containing field names and values to update
 * @returns The updated incident details
 */
export async function updateIncident(incidentNumber: string, fields: Record<string, any>): Promise<any> {
  try {
    await poolConnect;
    
    // Build the SET clause for the UPDATE statement
    const setClause = Object.entries(fields)
      .map(([field, _]) => `${field} = @${field}`)
      .join(', ');
    
    // Create the request
    const request = pool.request()
      .input('incidentNumber', sql.VarChar, incidentNumber);
    
    // Add parameters for each field
    Object.entries(fields).forEach(([field, value]) => {
      request.input(field, value);
    });
    
    // Get table name from environment variable or use default
    const tableName = process.env.DB_TABLE_NAME || 'Incidents';
    
    // Execute the update query
    await request.query(`
      UPDATE ${tableName} 
      SET ${setClause} 
      WHERE IncidentNumber = @incidentNumber
    `);
    
    // Retrieve and return the updated record
    return await getIncidentByNumber(incidentNumber);
  } catch (err) {
    console.error('SQL error:', err);
    throw err;
  }
}

export default pool;