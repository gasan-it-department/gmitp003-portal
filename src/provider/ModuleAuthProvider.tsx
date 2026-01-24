import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "./ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import axios from "@/db/axios";
import { panels } from "@/layout/ControlPanel";

type ModuleContextType = {
  currPath: string;
  setPath: (path: string) => void;
  hasAccess: boolean;
  isLoading: boolean;
  error: Error | null;
  matchedPanelPath: string | null;
};

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

type ModuleAuthProviderProps = {
  children: React.ReactNode;
};

const ModuleAuthProvider = ({ children }: ModuleAuthProviderProps) => {
  const [path, setPath] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [matchedPanelPath, setMatchedPanelPath] = useState<string | null>(null);

  const location = useLocation();
  const auth = useAuth();
  const nav = useNavigate();

  // Create a map of panel paths for O(1) lookup
  const panelPaths = useMemo(() => {
    return new Set(panels.map((panel) => panel.path));
  }, []);

  // Optimized function to find matching panel path
  const findMatchingPanelPath = useCallback(
    (currentPath: string): string | null => {
      // 1. First check for exact match (O(1) lookup)
      if (panelPaths.has(currentPath)) {
        return currentPath;
      }

      // 2. Check if current path starts with any panel path (for nested routes)
      for (const panelPath of panelPaths) {
        if (
          currentPath.startsWith(panelPath + "/") ||
          currentPath === panelPath
        ) {
          return panelPath;
        }
      }

      // 3. For more complex matching (e.g., dynamic routes like /users/:id)
      // Extract the first segment of the path
      const pathSegments = currentPath.split("/").filter(Boolean);
      if (pathSegments.length > 0) {
        const firstSegmentPath = `/${pathSegments[0]}`;
        if (panelPaths.has(firstSegmentPath)) {
          return firstSegmentPath;
        }
      }

      return null;
    },
    [panelPaths],
  );

  const checkModuleAccess = useCallback(
    async (pathToCheck: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get("/user/module-access", {
          params: {
            userId: auth.userId,
            moduleName: pathToCheck,
          },
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });

        const hasAccess =
          response.status === 200 && response.data?.message === "OK";
        setHasAccess(hasAccess);
        return hasAccess;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to check module access");
        setError(error);
        setHasAccess(false);
        //nav(-1);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [auth.userId, auth.token, location.pathname],
  );

  const {
    data: moduleAccess,
    isLoading: queryLoading,
    refetch,
  } = useQuery({
    queryKey: ["module-access", auth.userId, path],
    queryFn: () => checkModuleAccess(path),
    enabled: false, // We'll trigger manually after we find the panel path
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Update path and find matching panel when location changes
  useEffect(() => {
    const currentPath = location.pathname;
    const matchedPath = findMatchingPanelPath(currentPath);

    setMatchedPanelPath(matchedPath);

    // If we found a matching panel path, use it for module access check
    // Otherwise, use the current path
    const pathToUse = matchedPath || currentPath;
    setPath(pathToUse);
  }, [location.pathname, findMatchingPanelPath]);

  // Check access when path changes
  useEffect(() => {
    if (path && auth.userId && auth.token) {
      refetch();
    }
  }, [path, auth.userId, auth.token, refetch]);

  // Combined loading state
  const combinedIsLoading = isLoading || queryLoading;

  // Combined access state
  const combinedHasAccess =
    moduleAccess !== undefined ? moduleAccess : hasAccess;

  const contextValue: ModuleContextType = useMemo(
    () => ({
      currPath: path,
      setPath: (newPath: string) => {
        const matchedPath = findMatchingPanelPath(newPath);
        setMatchedPanelPath(matchedPath);
        setPath(matchedPath || newPath);
      },
      hasAccess: combinedHasAccess,
      isLoading: combinedIsLoading,
      error,
      matchedPanelPath,
    }),
    [
      path,
      combinedHasAccess,
      combinedIsLoading,
      error,
      matchedPanelPath,
      findMatchingPanelPath,
    ],
  );

  if (isLoading || queryLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ModuleContext.Provider value={contextValue}>
      {children}
    </ModuleContext.Provider>
  );
};

export default ModuleAuthProvider;

export const useModuleAuth = (): ModuleContextType => {
  const context = useContext(ModuleContext);

  if (!context) {
    throw new Error("useModuleAuth must be used within a ModuleAuthProvider");
  }

  return context;
};

// Optional: Hook for checking access to a specific path
export const useCheckModuleAccess = (specificPath?: string) => {
  const { hasAccess, isLoading, error, setPath } = useModuleAuth();

  useEffect(() => {
    if (specificPath) {
      setPath(specificPath);
    }
  }, [specificPath, setPath]);

  return { hasAccess, isLoading, error };
};
