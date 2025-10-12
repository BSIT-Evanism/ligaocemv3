"use client"

import { cn } from "@/lib/utils"
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react"

export interface RequestStepperProps {
    status: "pending" | "processing" | "approved" | "rejected"
    className?: string
}

const statusConfig = {
    pending: {
        step: 1,
        label: "Pending",
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200"
    },
    processing: {
        step: 2,
        label: "Processing",
        icon: AlertCircle,
        color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    approved: {
        step: 3,
        label: "Approved",
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 border-green-200"
    },
    rejected: {
        step: 4,
        label: "Rejected",
        icon: XCircle,
        color: "bg-red-100 text-red-800 border-red-200"
    },
} as const

const steps = [
    { step: 1, label: "Pending", icon: Clock },
    { step: 2, label: "Processing", icon: AlertCircle },
    { step: 3, label: "Approved", icon: CheckCircle },
    { step: 4, label: "Rejected", icon: XCircle },
]

export function RequestStepper({ status, className }: RequestStepperProps) {
    const currentStep = statusConfig[status]?.step ?? 1

    return (
        <div className={cn("w-full", className)}>
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = step.step < currentStep
                    const isCurrent = step.step === currentStep
                    const isPending = step.step > currentStep

                    const Icon = step.icon

                    return (
                        <div key={step.step} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                                        isCompleted && "bg-green-500 border-green-500 text-white",
                                        isCurrent && statusConfig[status]?.color,
                                        isPending && "bg-gray-100 border-gray-300 text-gray-400"
                                    )}
                                >
                                    {isCompleted ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "mt-2 text-xs font-medium transition-colors duration-200",
                                        isCompleted && "text-green-600",
                                        isCurrent && "text-gray-900",
                                        isPending && "text-gray-400"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "flex-1 h-0.5 mx-4 transition-colors duration-200",
                                        step.step < currentStep ? "bg-green-500" : "bg-gray-300"
                                    )}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
