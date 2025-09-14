import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WizardNavigationProps {
	currentStepIndex: number;
	totalSteps: number;
	canGoNext: boolean;
	canGoPrevious: boolean;
	onNext: () => void;
	onPrevious: () => void;
	nextLabel?: string;
}

export function WizardNavigation({
	currentStepIndex,
	totalSteps,
	canGoNext,
	canGoPrevious,
	onNext,
	onPrevious,
	nextLabel = "Continue",
}: WizardNavigationProps) {
	return (
		<div className="flex items-center justify-between pt-6 border-t">
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					onClick={onPrevious}
					disabled={!canGoPrevious}
					className="flex items-center gap-2"
				>
					<ChevronLeft className="w-4 h-4" />
					Previous
				</Button>
			</div>

			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">
					Step {currentStepIndex + 1} of {totalSteps}
				</span>

				<Button
					onClick={onNext}
					disabled={!canGoNext}
					className="flex items-center gap-2"
				>
					{nextLabel}
					{nextLabel !== "Submit" && <ChevronRight className="w-4 h-4" />}
				</Button>
			</div>
		</div>
	);
}
