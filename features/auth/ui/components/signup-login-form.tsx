"use client"

import type React from "react"
import { useState, useId } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { X, Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useRateLimit } from "@/features/auth/hooks/use-rate-limit"
import { trpc } from "@/trpc/client"
import { emailSchema, phoneSchema, fullNameSchema } from "../../lib/validations"
import { signIn } from "@/lib/auth-client"

interface InsetLabelInputProps {
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  prefix?: React.ReactNode
  isPhoneInput?: boolean
  error?: string
}

function InsetLabelInput({
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
  const id = useId()
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0
  const isEmpty = !hasValue && !isFocused

  if (isPhoneInput && prefix) {
    return (
      <div className={`relative ${className}`}>
        <label
          className={cn(
            "relative flex rounded-lg border bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
            isEmpty && "Input--empty",
            error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
          )}
        >
          <div className="flex items-center px-3 py-2 border-r border-gray-200 dark:border-gray-700">
            <img
              className="w-5 h-4 mr-2"
              src="https://b.stripecdn.com/link-statics-srv/assets/FlagIcon-UG.138ae518.svg"
              alt="Uganda flag"
            />
            <span className="text-sm font-medium text-foreground">{prefix}</span>
          </div>

          <div className="relative flex-1">
            <div
              className={cn(
                "absolute text-sm font-medium pointer-events-none text-muted-foreground transition-all duration-300 ease-out px-3",
                hasValue || isFocused ? "top-2 text-xs" : "top-1/2 -translate-y-1/2 text-sm",
              )}
            >
              {label}
            </div>
            <input
              id={id}
              type={type}
              className={cn(
                "text-foreground placeholder:text-transparent flex w-full bg-transparent text-sm focus-visible:outline-none px-3 transition-all duration-300 ease-out",
                hasValue || isFocused ? "h-14 pt-6 pb-2" : "h-14 py-4",
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
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center">
        {prefix && (
          <div className="bg-white text-sm text-center font-medium text-foreground rounded-md px-1.5 py-0.5 mr-1.5">
            {prefix}
          </div>
        )}
        <label
          className={cn(
            "relative flex-1 block rounded-lg border bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
            isEmpty && "Input--empty",
            error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
          )}
        >
          <div
            className={cn(
              "absolute text-sm font-medium pointer-events-none text-muted-foreground transition-all duration-300 ease-out px-3",
              hasValue || isFocused ? "top-2 text-xs" : "top-1/2 -translate-y-1/2 text-sm",
            )}
          >
            {label}
          </div>
          <input
            id={id}
            type={type}
            className={cn(
              "text-foreground placeholder:text-transparent flex w-full bg-transparent text-sm focus-visible:outline-none px-3 transition-all duration-300 ease-out",
              hasValue || isFocused ? "h-14 pt-6 pb-2" : "h-14 py-4",
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
  )
}

export function SignupLoginForm() {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [fullName, setFullName] = useState("")
  const [errors, setErrors] = useState<{ email?: string; phone?: string; fullName?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const debouncedEmail = useDebounce(email, 500)
  const { isBlocked } = useRateLimit({ maxRequests: 5, windowMs: 60000 })

  const checkUserQuery = trpc.auth.checkUserExists.useQuery(
    { email: debouncedEmail },
    {
      enabled: !!debouncedEmail && emailSchema.safeParse(debouncedEmail).success && !isBlocked,
      retry: false,
    }
  );
  
  const { data: userData, error: userError, isLoading: isCheckingUser } = checkUserQuery;
  
  // Derive state directly - no useEffect needed
  const userExists = userData?.exists ?? false;
  const showEmailPill = userExists;
  
  // Handle errors directly in render
  if (userError?.data?.code === "TOO_MANY_REQUESTS") {
    // Set error immediately in state during render
    if (!errors.email) {
      setErrors(prev => ({ ...prev, email: userError.message }));
    }
  } else if (!userError && errors.email) {
    // Clear error immediately when query succeeds
    setErrors(prev => ({ ...prev, email: "" }));
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)

    const emailValidation = emailSchema.safeParse(value)
    if (!emailValidation.success && value) {
      setErrors(prev => ({ ...prev, email: emailValidation.error.errors[0].message }))
    } else {
      setErrors(prev => ({ ...prev, email: undefined }))
    }
  }

  const handlePhoneChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "")
    setPhone(cleanValue)

    const phoneValidation = phoneSchema.safeParse(cleanValue)
    if (!phoneValidation.success && cleanValue) {
      setErrors(prev => ({ ...prev, phone: phoneValidation.error.errors[0].message }))
    } else {
      setErrors(prev => ({ ...prev, phone: undefined }))
    }
  }

  const handleFullNameChange = (value: string) => {
    setFullName(value)

    const nameValidation = fullNameSchema.safeParse(value)
    if (!nameValidation.success && value) {
      setErrors(prev => ({ ...prev, fullName: nameValidation.error.errors[0].message }))
    } else {
      setErrors(prev => ({ ...prev, fullName: undefined }))
    }
  }

  const handleClearEmail = () => {
    setEmail("")
    setPhone("")
    setFullName("")
    setErrors({})
  }

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true)
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      })
    } catch (error) {
      console.error("Google sign in failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (userExists) {
        await signIn.magicLink({
          email,
          callbackURL: "/",
        })
      } else {
        console.log("Signing up:", { email, phone: `+256${phone}`, fullName })
      }
    } catch (error) {
      console.error("Auth failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = userExists === true 
    ? emailSchema.safeParse(email).success
    : emailSchema.safeParse(email).success && 
      phoneSchema.safeParse(phone).success && 
      fullNameSchema.safeParse(fullName).success

  const isLoading = checkUserQuery.isLoading || isSubmitting

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">Welcome to Kampe</h1>
          <p className="text-muted-foreground text-base">Log in or sign up to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 256 262"
                  className="mr-2"
                >
                  <path
                    fill="#4285F4"
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  />
                  <path
                    fill="#34A853"
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  />
                  <path
                    fill="#FBBC05"
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                  />
                  <path
                    fill="#EB4335"
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  />
                </svg>
              )}
              Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {showEmailPill && userExists && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between"
                  >
                    <Badge
                      variant="secondary"
                      className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-3 py-2 text-sm font-medium flex-1 justify-between"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={handleClearEmail}
                        className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showEmailPill && (
                <InsetLabelInput
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  error={errors.email}
                />
              )}

              <AnimatePresence>
                {userExists === false && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-4"
                  >
                    <InsetLabelInput
                      label="Mobile phone number"
                      type="tel"
                      placeholder="Mobile phone number"
                      value={phone}
                      onChange={handlePhoneChange}
                      prefix="+256"
                      isPhoneInput={true}
                      error={errors.phone}
                    />
                    <InsetLabelInput
                      label="Full name"
                      type="text"
                      placeholder="Full name"
                      value={fullName}
                      onChange={handleFullNameChange}
                      error={errors.fullName}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {(userExists === true || userExists === false) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6"
              >
                <p className="text-sm text-muted-foreground text-center">
                  By continuing you agree to the{" "}
                  <a href="#" className="underline hover:text-foreground transition-colors">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="underline hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </p>
                <Button
                  type="submit"
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-lg text-base font-medium"
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : null}
                  {userExists ? "Sign in" : "Sign up"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  )
}