import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type IndustryType = 'manufacturing' | 'consumer-goods';

interface IndustryContextType {
  industry: IndustryType | null;
  setIndustry: (industry: IndustryType) => void;
}

const IndustryContext = createContext<IndustryContextType | undefined>(undefined);

// Helper function to get industry from URL path
const getIndustryFromPath = (path: string): IndustryType | null => {
  if (path === '/home/consumergoods') {
    return 'consumer-goods';
  } else if (path === '/home/manufacturing') {
    return 'manufacturing';
  }
  return null;
};

export const IndustryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize industry from URL path if available (for direct navigation)
  const [industry, setIndustry] = useState<IndustryType | null>(() => {
    if (typeof window !== 'undefined') {
      return getIndustryFromPath(window.location.pathname);
    }
    return null;
  });

  // Sync with URL changes (for browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const industryFromPath = getIndustryFromPath(window.location.pathname);
      if (industryFromPath !== null) {
        setIndustry(industryFromPath);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <IndustryContext.Provider value={{ industry, setIndustry }}>
      {children}
    </IndustryContext.Provider>
  );
};

export const useIndustry = () => {
  const context = useContext(IndustryContext);
  if (context === undefined) {
    throw new Error('useIndustry must be used within an IndustryProvider');
  }
  return context;
};
