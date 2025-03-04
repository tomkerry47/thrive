import { Configuration, LogLevel } from '@azure/msal-browser';

// Get environment variables from .env file
const clientId = process.env.REACT_APP_AZURE_CLIENT_ID as string;
const tenantId = process.env.REACT_APP_AZURE_TENANT_ID as string;
const requiredGroupId = process.env.REACT_APP_REQUIRED_GROUP_ID as string;
const requiredAppRole = process.env.REACT_APP_REQUIRED_APP_ROLE as string;

// Get API configuration from environment variables
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT as string;
const apiKey = process.env.REACT_APP_API_KEY as string;
const apiHeaderName = process.env.REACT_APP_API_HEADER_NAME as string;
const apiPreconfiguredStatement = process.env.REACT_APP_API_PRECONFIGURED_STATEMENT as string;

// Get AI model parameters from environment variables
const apiTemperature = parseFloat(process.env.REACT_APP_API_TEMPERATURE as string);
const apiTopP = parseFloat(process.env.REACT_APP_API_TOP_P as string);
const apiMaxTokens = parseInt(process.env.REACT_APP_API_MAX_TOKENS as string, 10);

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: clientId, // Read from environment variable
    authority: `https://login.microsoftonline.com/${tenantId}`, // Read from environment variable
    redirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage', // Changed to localStorage for better persistence
    storeAuthStateInCookie: true,  // Enable cookies for better SSO experience
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
      logLevel: LogLevel.Verbose, // Match Testauthapp logger configuration
    }
  }
};

// Add scopes for the API you want to access
export const loginRequest = {
  scopes: ["User.Read", "profile", "email", "openid"], // Match Testauthapp scopes
  prompt: "select_account", // Match Testauthapp prompt setting
  // Keep the claims request for group membership
  claims: JSON.stringify({
    id_token: {
      groups: {
        essential: true
      }
    },
    access_token: {
      groups: {
        essential: true
      }
    }
  })
};

// Silent request object for token acquisition
// Note: We're not using silent authentication to prevent refresh issues
export const silentRequest = {
  scopes: ["User.Read", "profile", "email", "openid"],
  forceRefresh: false // Disabled token refreshing to prevent authentication issues
};

// Export API configuration for HTTP POST requests
export const httpApiConfig = {
  endpoint: apiEndpoint,
  key: apiKey,
  headerName: apiHeaderName,
  preconfiguredStatement: apiPreconfiguredStatement,
  temperature: apiTemperature,
  topP: apiTopP,
  maxTokens: apiMaxTokens
};

// Export access control configuration
export const accessControl = {
  requiredGroupId: requiredGroupId,
  requiredAppRole: requiredAppRole,
  // Use group-based authentication like Testauthapp
  useAppRoles: false
};