// Helper function to handle API errors gracefully
// Filters out authentication errors during development/hot reload
export const handleApiError = (error, setError) => {
  // Check if it's an authentication error (should be handled silently)
  if (error?.isAuthError || error?.message?.includes('Authentication') || error?.message?.includes('token')) {
    // Don't show authentication errors in UI - they're handled by redirect
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('Authentication error handled silently:', error.message);
    }
    return; // Don't set error state for auth errors
  }

  // For other errors, set the error state normally
  if (setError) {
    setError(error.message || 'An error occurred');
  }
};

