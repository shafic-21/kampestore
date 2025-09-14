// features/seller/product-creation/components/ProductCreationWizard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCatalogCreationStore } from "../store/use-catalog-creation-store";
import { WizardNavigation } from "./wizard-navigation";
import { WizardProgress } from "./wizard-progress";

// Step Components
import SearchStep from "./steps/search-step";
import DetailsStep from "./steps/details-step";

interface ProductCreationWizardProps {
	currentStep: string;
}

export function ProductCreationWizard({
	currentStep,
}: ProductCreationWizardProps) {
	const router = useRouter();
	const {
		mode,
		creationType,
		steps,
		isLoading,
		setCurrentStep,
		generateDraftId,
		setCatalogProductId,
		updateDraft,
	} = useCatalogCreationStore();

	// Sync current step with store
	useEffect(() => {
		setCurrentStep(currentStep);
		generateDraftId(); // Ensure we have draftId for uploads
	}, [currentStep, setCurrentStep, generateDraftId]);

	// Get current step configuration
	const currentStepConfig = steps.find((step) => step.id === currentStep);
	const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

	// Navigation handlers
	const handleNext = () => {
		const nextIndex = currentStepIndex + 1;
		if (nextIndex < steps.length) {
			const nextStep = steps[nextIndex];
			router.push(`/seller-center/products/new/${nextStep.id}`);
		}
	};

	const handlePrevious = () => {
		const prevIndex = currentStepIndex - 1;
		if (prevIndex >= 0) {
			const prevStep = steps[prevIndex];
			router.push(`/seller-center/products/new/${prevStep.id}`);
		}
	};

	const handleStepClick = (stepId: string) => {
		const step = steps.find((s) => s.id === stepId);
		if (step?.isAccessible) {
			router.push(`/seller-center/products/new/${stepId}`);
		}
	};

	// SearchStep specific handlers
	const handleExistingProductSelect = (catalogProductId: string) => {
		setCatalogProductId(catalogProductId);
		// This means we're creating an offer for existing product
		// Skip to variants step since basic details are already set
	};

	const handleCreateNew = () => {
		setCatalogProductId(undefined);
		// We're creating a brand new product
		updateDraft({ hasVariants: false }); // Default to simple product
	};

	// Render current step component
	const renderCurrentStep = () => {
		switch (currentStep) {
			case "search":
				// Only show for full-product creation
				return creationType === "full-product" ? (
					<SearchStep
						onNext={handleNext}
						onExistingProductSelect={handleExistingProductSelect}
						onCreateNew={handleCreateNew}
					/>
				) : null;

			case "details":
				return <DetailsStep onNext={handleNext} onPrevious={handlePrevious} />;

			case "variants":
				return (
					<div className="text-center py-12">
						<h3 className="text-lg font-medium mb-2">Variants Step</h3>
						<p className="text-muted-foreground">Coming soon...</p>
					</div>
				);

			case "content":
				return (
					<div className="text-center py-12">
						<h3 className="text-lg font-medium mb-2">Content Step</h3>
						<p className="text-muted-foreground">Coming soon...</p>
					</div>
				);

			case "review":
				return (
					<div className="text-center py-12">
						<h3 className="text-lg font-medium mb-2">Review Step</h3>
						<p className="text-muted-foreground">Coming soon...</p>
					</div>
				);

			default:
				return (
					<div className="text-center py-12">
						<h3 className="text-lg font-medium mb-2">Step not found</h3>
						<p className="text-muted-foreground">Invalid step: {currentStep}</p>
					</div>
				);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-8">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold">
						{mode === "create" ? "Add New Product" : "Edit Product"}
					</h1>
					<p className="text-muted-foreground">
						{creationType === "offer-only"
							? "Create your seller offer for this existing product"
							: "Create a new product listing for the marketplace"}
					</p>
				</div>

				<WizardProgress
					steps={steps}
					currentStep={currentStep}
					onStepClick={handleStepClick}
				/>
			</div>

			<div className="bg-card rounded-lg border p-6">{renderCurrentStep()}</div>

			<WizardNavigation
				currentStepIndex={currentStepIndex}
				totalSteps={steps.length}
				canGoNext={currentStepConfig?.isComplete || false}
				canGoPrevious={currentStepIndex > 0}
				onNext={handleNext}
				onPrevious={handlePrevious}
				nextLabel={
					currentStepIndex === steps.length - 1 ? "Submit" : "Continue"
				}
			/>
		</div>
	);
}
