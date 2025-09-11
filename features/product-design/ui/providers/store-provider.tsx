"use client";

import { useEffect, useState } from "react";
import { useProductDesignStore } from "../../store";

interface StoreProviderProps {
	children: React.ReactNode;
}

/**
 * StoreProvider Component
 *
 * This provider component initializes the product designer store session
 * and manages the lifecycle of the store data. It handles hydration from
 * localStorage and ensures proper cleanup when the session ends.
 *
 * ARCHITECTURE:
 * - Store uses persist middleware with localStorage
 * - Session management handles initialization and cleanup
 * - Provides loading state during hydration
 * - Handles blob URL cleanup for previews
 *
 * DATA FLOW:
 * 1. Component mounts and waits for store hydration
 * 2. Initialize session when store is ready
 * 3. Child components consume data from the persistent store
 * 4. Cleanup session and blob URLs on unmount
 */
export function StoreProvider({ children }: StoreProviderProps) {
	const [isHydrated, setIsHydrated] = useState(false);

	// Get store actions for session management
	const initializeSession = useProductDesignStore(
		(state) => state.initializeSession,
	);
	const cleanupSession = useProductDesignStore((state) => state.cleanupSession);

	// Handle store hydration and session initialization
	useEffect(() => {
		// Wait for zustand persist to hydrate from localStorage
		const unsubscribe = useProductDesignStore.persist.onFinishHydration(() => {
			setIsHydrated(true);
			initializeSession();
		});

		// If already hydrated, initialize immediately
		if (useProductDesignStore.persist.hasHydrated()) {
			setIsHydrated(true);
			initializeSession();
		}

		// Cleanup function
		return () => {
			unsubscribe();
			cleanupSession();
		};
	}, [initializeSession, cleanupSession]);

	// Show loading state while waiting for hydration
	if (!isHydrated) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	// Render children once store is hydrated
	return <>{children}</>;
}
