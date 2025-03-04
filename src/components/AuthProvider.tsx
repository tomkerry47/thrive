import React, { ReactNode, useEffect, useState, useCallback } from "react";
import {
  MsalProvider,
  useMsal,
  useIsAuthenticated,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import {
  PublicClientApplication,
  EventType,
  EventMessage,
  AuthenticationResult,
  InteractionStatus,
} from "@azure/msal-browser";
import { msalConfig, loginRequest, accessControl } from "../authConfig";

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Set up silent authentication
msalInstance.initialize().then(() => {
  // Account selection logic is app dependent. Adjust as needed for your use case
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult;
      const account = payload.account;
      msalInstance.setActiveAccount(account);
    }
  });
});

// Login button component
const LoginButton: React.FC = () => {
  const { instance } = useMsal();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoggingIn(false);
    }
  }, [instance]);

  return (
    <div className="login-container">
      <p>You need to sign in to access this application.</p>
      <button 
        onClick={handleLogin} 
        disabled={isLoggingIn}
        className="btn btn-primary"
      >
        {isLoggingIn ? "Signing in..." : "Sign in with Microsoft"}
      </button>
    </div>
  );
};

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  userInfo: {
    name?: string;
    username?: string;
    roles?: string[];
    groups?: string[];
  } | null;
  login: () => Promise<void>;
  accessDeniedContent: React.ReactNode;
}

// Create authentication context
const AuthContext = React.createContext<AuthContextType>({
  isAuthenticated: false,
  isAuthorized: false,
  isLoading: false,
  userInfo: null,
  login: async () => {},
  accessDeniedContent: null
});

// Authentication provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProviderContent>{children}</AuthProviderContent>
    </MsalProvider>
  );
};

// Authentication provider content component
const AuthProviderContent: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<AuthContextType["userInfo"]>(null);
  const [silentAuthAttempted, setSilentAuthAttempted] = useState<boolean>(false);

  // Handle interactive login
  const login = useCallback(async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error("Interactive login failed:", error);
    }
  }, [instance]);

  // Check user authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      if (isAuthenticated && accounts.length > 0) {
        try {
          // Get ID token claims
          const currentAccount = accounts[0];
          const idTokenClaims = currentAccount.idTokenClaims as {
            name?: string;
            preferred_username?: string;
            roles?: string[];
            groups?: string[];
          };

          // Extract user info
          const name = idTokenClaims?.name;
          const username = idTokenClaims?.preferred_username;
          const roles = idTokenClaims?.roles || [];
          const groups = idTokenClaims?.groups || [];

          // Debug: Log required group and user's groups
          console.log("Required Group ID:", accessControl.requiredGroupId);
          console.log("User's Groups:", groups);

          // Direct check for the specific group ID we're looking for - exactly like in Testauthapp
          const isInSpecificGroup = groups.includes(accessControl.requiredGroupId);
          
          // Debug: Log authorization check results
          console.log(`Is In Specific Group (${accessControl.requiredGroupId}):`, isInSpecificGroup);

          // Set authorization status - only authorize if in the specific group
          const authorized = isInSpecificGroup;
          console.log("Is Authorized:", authorized);
          setIsAuthorized(authorized);

          // Set user info
          setUserInfo({
            name,
            username,
            roles,
            groups,
          });

          if (!authorized) {
            console.log("User is not authorized. Showing access restricted page.");
          }
        } catch (error) {
          console.error("Error checking authorization:", error);
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(false);
        setUserInfo(null);
      }
      
      // Only set loading to false if we've attempted silent auth
      if (silentAuthAttempted || isAuthenticated) {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [isAuthenticated, accounts, silentAuthAttempted, instance]);

  // Attempt silent authentication on component mount
  useEffect(() => {
    const attemptSilentAuth = async () => {
      if (!isAuthenticated && accounts.length === 0 && !silentAuthAttempted) {
        try {
          console.log("Attempting silent authentication on page load");
          setIsLoading(true);
          // Use ssoSilent with the same configuration as loginRequest to ensure groups are retrieved
          await instance.ssoSilent(loginRequest);
        } catch (error) {
          console.log("Silent authentication failed:", error);
          // This is expected if the user is not already signed in
        } finally {
          setSilentAuthAttempted(true);
          setIsLoading(false);
        }
      }
    };

    attemptSilentAuth();
  }, [instance, isAuthenticated, accounts, silentAuthAttempted]);

  // Update loading state based on MSAL interaction status
  useEffect(() => {
    setIsLoading(inProgress !== InteractionStatus.None);
  }, [inProgress]);

  // Access denied content component
  const AccessDeniedContent: React.FC = () => (
    <div style={{
      padding: '30px',
      textAlign: 'center',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      marginTop: '20px'
    }}>
      <div style={{
        backgroundColor: '#fed9cc',
        color: '#d83b01',
        padding: '15px',
        margin: '0 0 20px 0',
        borderRadius: '4px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1.2rem'
      }}>
        Access Restricted
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>
          You are authenticated but not authorized to access this application.
        </p>
        <p style={{ marginBottom: '15px' }}>
          This application is restricted to members of specific Azure AD groups.
          If you believe you should have access, please contact your administrator.
        </p>
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '4px',
          display: 'inline-block',
          margin: '10px 0'
        }}>
          <p style={{ margin: '0', fontFamily: 'monospace' }}>
            Required Group ID: <strong>{accessControl.requiredGroupId}</strong>
          </p>
        </div>
      </div>
      
      <button 
        onClick={() => {
          instance.logoutRedirect({
            postLogoutRedirectUri: window.location.origin,
          });
        }}
        style={{
          backgroundColor: '#0078d4',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#106ebe'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0078d4'}
      >
        Sign Out
      </button>
    </div>
  );

  // Render loading state or authentication templates
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      );
    }

    return (
      <>
        <AuthenticatedTemplate>
          {isAuthorized ? children : <AccessDeniedContent />}
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
          <LoginButton />
        </UnauthenticatedTemplate>
      </>
    );
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthorized,
        isLoading,
        userInfo,
        login,
        accessDeniedContent: <AccessDeniedContent />
      }}
    >
      {renderContent()}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => {
  return React.useContext(AuthContext);
};

export default AuthProvider;