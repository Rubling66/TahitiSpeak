import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ABTestingService, ABTestConfig, ABTestAssignment } from '../services/ABTestingService';

interface ABTestContextType {
  service: ABTestingService;
  userTests: ABTestAssignment[];
  getVariant: (testId: string) => Promise<Record<string, any> | null>;
  trackConversion: (testId: string, metric?: string) => Promise<void>;
  isInTest: (testId: string) => boolean;
  getTestConfig: (testId: string) => Record<string, any> | null;
  loading: boolean;
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined);

interface ABTestProviderProps {
  children: ReactNode;
  userId?: string;
  userProperties?: Record<string, any>;
}

export const ABTestProvider: React.FC<ABTestProviderProps> = ({
  children,
  userId,
  userProperties = {},
}) => {
  const [service] = useState(() => new ABTestingService());
  const [userTests, setUserTests] = useState<ABTestAssignment[]>([]);
  const [variantConfigs, setVariantConfigs] = useState<Map<string, Record<string, any>>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      initializeUserTests();
    } else {
      setLoading(false);
    }
  }, [userId, userProperties]);

  const initializeUserTests = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Get all active tests
      const activeTests = service.getActiveTests();
      
      // Assign user to tests and collect variant configs
      const assignments: ABTestAssignment[] = [];
      const configs = new Map<string, Record<string, any>>();

      for (const test of activeTests) {
        try {
          // Assign user to test
          const variantId = await service.assignUser(userId, test.id, userProperties);
          
          if (variantId) {
            // Get user assignment
            const assignment = service.getUserTests(userId).find(a => a.testId === test.id);
            if (assignment) {
              assignments.push(assignment);
              
              // Expose user to test
              await service.exposeUser(userId, test.id);
              
              // Get variant config
              const config = await service.getVariantConfig(userId, test.id);
              if (config) {
                configs.set(test.id, config);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to assign user to test ${test.id}:`, error);
        }
      }

      setUserTests(assignments);
      setVariantConfigs(configs);
    } catch (error) {
      console.error('Failed to initialize user tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVariant = async (testId: string): Promise<Record<string, any> | null> => {
    if (!userId) return null;

    try {
      // Check if we already have the config cached
      if (variantConfigs.has(testId)) {
        return variantConfigs.get(testId) || null;
      }

      // Get variant config from service
      const config = await service.getVariantConfig(userId, testId);
      if (config) {
        setVariantConfigs(prev => new Map(prev).set(testId, config));
      }

      return config;
    } catch (error) {
      console.error(`Failed to get variant for test ${testId}:`, error);
      return null;
    }
  };

  const trackConversion = async (testId: string, metric?: string): Promise<void> => {
    if (!userId) return;

    try {
      await service.convertUser(userId, testId, metric);
    } catch (error) {
      console.error(`Failed to track conversion for test ${testId}:`, error);
    }
  };

  const isInTest = (testId: string): boolean => {
    return userTests.some(test => test.testId === testId);
  };

  const getTestConfig = (testId: string): Record<string, any> | null => {
    return variantConfigs.get(testId) || null;
  };

  const contextValue: ABTestContextType = {
    service,
    userTests,
    getVariant,
    trackConversion,
    isInTest,
    getTestConfig,
    loading,
  };

  return (
    <ABTestContext.Provider value={contextValue}>
      {children}
    </ABTestContext.Provider>
  );
};

export const useABTest = (): ABTestContextType => {
  const context = useContext(ABTestContext);
  if (context === undefined) {
    throw new Error('useABTest must be used within an ABTestProvider');
  }
  return context;
};

// Hook for getting a specific test variant
export const useTestVariant = (testId: string) => {
  const { getVariant, isInTest, getTestConfig, trackConversion, loading } = useABTest();
  const [variant, setVariant] = useState<Record<string, any> | null>(null);
  const [variantLoading, setVariantLoading] = useState(true);

  useEffect(() => {
    const loadVariant = async () => {
      try {
        setVariantLoading(true);
        const config = await getVariant(testId);
        setVariant(config);
      } catch (error) {
        console.error(`Failed to load variant for test ${testId}:`, error);
        setVariant(null);
      } finally {
        setVariantLoading(false);
      }
    };

    if (!loading) {
      loadVariant();
    }
  }, [testId, getVariant, loading]);

  const convert = (metric?: string) => {
    trackConversion(testId, metric);
  };

  return {
    variant,
    isInTest: isInTest(testId),
    config: getTestConfig(testId),
    convert,
    loading: loading || variantLoading,
  };
};

// Hook for feature flags (simple boolean tests)
export const useFeatureFlag = (testId: string, flagName: string, defaultValue: boolean = false) => {
  const { variant, loading } = useTestVariant(testId);

  if (loading) {
    return { enabled: defaultValue, loading: true };
  }

  const enabled = variant?.[flagName] ?? defaultValue;
  return { enabled, loading: false };
};

// Hook for A/B testing UI components
export const useComponentVariant = <T extends Record<string, any>>(
  testId: string,
  variants: T,
  defaultVariant: keyof T
) => {
  const { variant, convert, loading } = useTestVariant(testId);

  if (loading) {
    return {
      component: variants[defaultVariant],
      variantName: defaultVariant,
      convert,
      loading: true,
    };
  }

  const variantName = variant?.component || defaultVariant;
  const component = variants[variantName] || variants[defaultVariant];

  return {
    component,
    variantName,
    convert,
    loading: false,
  };
};

// HOC for wrapping components with A/B testing
export const withABTest = <P extends object>(
  Component: React.ComponentType<P>,
  testId: string,
  variantPropName: string = 'variant'
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { variant, loading } = useTestVariant(testId);

    if (loading) {
      return null; // or a loading component
    }

    const enhancedProps = {
      ...props,
      [variantPropName]: variant,
    } as P & { [key: string]: any };

    return <Component {...enhancedProps} ref={ref} />;
  });
};

// Component for conditional rendering based on test variants
interface ABTestGateProps {
  testId: string;
  variant?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export const ABTestGate: React.FC<ABTestGateProps> = ({
  testId,
  variant: targetVariant,
  fallback = null,
  children,
}) => {
  const { variant, loading } = useTestVariant(testId);

  if (loading) {
    return <>{fallback}</>;
  }

  if (targetVariant && variant?.name !== targetVariant) {
    return <>{fallback}</>;
  }

  if (!targetVariant && !variant) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Component for rendering different variants
interface ABTestSwitchProps {
  testId: string;
  variants: Record<string, ReactNode>;
  defaultVariant?: string;
  fallback?: ReactNode;
}

export const ABTestSwitch: React.FC<ABTestSwitchProps> = ({
  testId,
  variants,
  defaultVariant,
  fallback = null,
}) => {
  const { variant, loading } = useTestVariant(testId);

  if (loading) {
    return <>{fallback}</>;
  }

  const variantName = variant?.name || defaultVariant;
  const content = variantName ? variants[variantName] : null;

  return <>{content || fallback}</>;
};

export default ABTestProvider;