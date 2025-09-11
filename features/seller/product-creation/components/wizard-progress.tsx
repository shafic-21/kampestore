import { CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CreationStep } from "../store/use-catalog-creation-store";

interface WizardProgressProps {
	steps: CreationStep[];
	currentStep: string;
	onStepClick: (stepId: string) => void;
}

export function WizardProgress({
	steps,
	currentStep,
	onStepClick,
}: WizardProgressProps) {
	return (
		<div className="flex items-center justify-between">
			{steps.map((step, index) => {
				const isActive = step.id === currentStep;
				const isCompleted = step.isComplete;
				const isAccessible = step.isAccessible;
				const isLast = index === steps.length - 1;

				return (
					<div key={step.id} className="flex items-center flex-1">
						<div className="flex items-center">
							<Button
								variant="ghost"
								size="sm"
								className={cn(
									"h-auto p-2 flex items-center gap-2",
									isActive && "bg-muted",
									!isAccessible && "cursor-not-allowed opacity-50",
								)}
								onClick={() => isAccessible && onStepClick(step.id)}
								disabled={!isAccessible}
							>
								{isCompleted ? (
									<CheckCircle className="w-5 h-5 text-green-600" />
								) : (
									<Circle
										className={cn(
											"w-5 h-5",
											isActive ? "text-primary" : "text-muted-foreground",
										)}
									/>
								)}
								<span
									className={cn(
										"text-sm font-medium",
										isActive ? "text-foreground" : "text-muted-foreground",
									)}
								>
									{step.title}
								</span>
							</Button>
						</div>

						{/* Connector line */}
						{!isLast && <div className="flex-1 h-px bg-border mx-4" />}
					</div>
				);
			})}
		</div>
	);
}
