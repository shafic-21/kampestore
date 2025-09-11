"use client";

import type React from "react";
import { useState, useId } from "react";
import { cn } from "@/lib/utils";

interface InsetLabelInputProps {
	label: string;
	type: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
	prefix?: React.ReactNode;
	isPhoneInput?: boolean;
	error?: string;
}

export function InsetLabelInput({
	label,
	type,
	placeholder,
	value,
	onChange,
	disabled,
	className,
	prefix,
	isPhoneInput = false,
	error,
}: InsetLabelInputProps) {
	const id = useId();
	const [isFocused, setIsFocused] = useState(false);
	const hasValue = value.length > 0;
	const isEmpty = !hasValue && !isFocused;

	if (isPhoneInput && prefix) {
		return (
			<div className={`relative ${className}`}>
				<label
					className={cn(
						"relative flex rounded-lg border bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
						isEmpty && "Input--empty",
						error &&
							"border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
					)}
				>
					<div className="flex items-center pl-3 py-2">
						<div className="bg-white flex-1 rounded-md px-2 flex h-full items-center">
							{" "}
							<img
								className="w-3 h-auto mr-1 object-contain"
								src="https://b.stripecdn.com/link-statics-srv/assets/FlagIcon-UG.138ae518.svg"
								alt="Uganda flag"
							/>
							<span className="text-xs font-medium text-foreground">
								{prefix}
							</span>
						</div>
					</div>

					<div className="relative flex-1">
						<div
							className={cn(
								"absolute pointer-events-none text-muted-foreground transition-all duration-300 ease-out px-3",
								hasValue || isFocused
									? "top-1 text-sm"
									: "top-1/2 -translate-y-1/2 text-base",
							)}
						>
							{label}
						</div>
						<input
							id={id}
							type={type}
							className={cn(
								"text-foreground placeholder:text-transparent flex w-full bg-transparent text-sm focus-visible:outline-none px-3 transition-all duration-300 ease-out h-12",
								hasValue || isFocused ? "pt-5 pb-1" : "py-3",
							)}
							placeholder={isFocused ? placeholder : ""}
							value={value}
							onChange={(e) => onChange(e.target.value)}
							onFocus={() => setIsFocused(true)}
							onBlur={() => setIsFocused(false)}
							disabled={disabled}
						/>
					</div>
				</label>
				{error && (
					<div className="mt-1 text-sm text-destructive flex items-center">
						<span className="inline-block w-1 h-1 bg-destructive rounded-full mr-2" />
						{error}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className={`relative ${className}`}>
			<div className="flex items-center">
				{prefix && (
					<div className="bg-white text-sm text-center font-medium text-foreground rounded-md px-1.5 py-0.5 mr-1">
						{prefix}
					</div>
				)}
				<label
					className={cn(
						"relative flex-1 block rounded-lg border bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
						isEmpty && "Input--empty",
						error &&
							"border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
					)}
				>
					<div
						className={cn(
							"absolute pointer-events-none text-muted-foreground transition-all duration-300 ease-out px-3",
							hasValue || isFocused
								? "top-1 text-sm"
								: "top-1/2 -translate-y-1/2 text-base",
						)}
					>
						{label}
					</div>
					<input
						id={id}
						type={type}
						className={cn(
							"text-foreground placeholder:text-transparent flex w-full bg-transparent text-sm focus-visible:outline-none px-3 transition-all duration-300 ease-out h-12",
							hasValue || isFocused ? "pt-5 pb-1" : "py-3",
						)}
						placeholder={isFocused ? placeholder : ""}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						disabled={disabled}
					/>
				</label>
			</div>
			{error && (
				<div className="mt-1 text-sm text-destructive flex items-center">
					<span className="inline-block w-1 h-1 bg-destructive rounded-full mr-2" />
					{error}
				</div>
			)}
		</div>
	);
}
