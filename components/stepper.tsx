"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  orientation = "horizontal",
  className,
}: StepperProps) {
  return (
    <div
      className={cn(
        "flex gap-4",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className,
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              "flex flex-1 gap-3",
              orientation === "vertical" && "flex-col",
            )}
          >
            <div className="flex items-start gap-3">
              {/* Step Circle */}
              <div
                className={cn(
                  "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  isCompleted
                    ? "border-primary bg-primary"
                    : isCurrent
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/30 bg-muted",
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-white" />
                ) : (
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isCurrent ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Step Label and Description */}
              <div className="flex flex-col gap-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCurrent
                      ? "text-foreground"
                      : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "transition-all",
                  orientation === "vertical"
                    ? "ml-5 h-6 w-0.5"
                    : "flex-1 h-0.5 self-auto mt-5",
                  isCompleted || isCurrent
                    ? "bg-primary"
                    : "bg-muted-foreground/20",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
