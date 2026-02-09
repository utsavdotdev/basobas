"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Stepper, type StepperStep } from "@/components/stepper";

interface PhoneVerificationProps {
  isVerified: boolean;
  onVerify: (phone: string) => void;
}

export function PhoneVerification({
  isVerified,
  onVerify,
}: PhoneVerificationProps) {
  const [step, setStep] = useState<"idle" | "phone" | "otp">("idle");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [resendCount, setResendCount] = useState(0);

  const steps: StepperStep[] = [
    {
      id: "phone",
      label: "Enter Phone Number",
      description: "Add your phone number to verify your account",
    },
    {
      id: "otp",
      label: "Enter OTP sent to your number",
      description: "Verify the 6-digit code from your SMS",
    },
  ];

  const currentStepIndex =
    step === "idle" ? 0 : step === "phone" ? 0 : step === "otp" ? 1 : 0;

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      setVerificationError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    setVerificationError("");

    setTimeout(() => {
      setStep("otp");
      setIsLoading(false);
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setVerificationError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setVerificationError("");

    setTimeout(() => {
      onVerify(phoneNumber);
      setPhoneNumber("");
      setOtp("");
      setStep("idle");
      setDialogOpen(false);
      setIsLoading(false);
      setResendCount(0);
    }, 1000);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setStep("idle");
    setPhoneNumber("");
    setOtp("");
    setVerificationError("");
    setResendCount(0);
  };

  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50/50 py-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Phone Number Verified
          </CardTitle>
          <CardDescription>
            Your phone number has been verified successfully
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-yellow-200 bg-yellow-50/50 py-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Phone Verification Required
          </CardTitle>
          <CardDescription>
            Verify your phone number to unlock landlord features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Phone verification helps protect your account and allows you to
            communicate securely with tenants.
          </p>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (open) {
                setStep("phone");
              } else {
                handleClose();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="w-full"
                onClick={() => {
                  setDialogOpen(true);
                  setStep("phone");
                }}
              >
                Verify Phone Number
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Verify Your Phone Number</DialogTitle>
                <DialogDescription>
                  We'll send you a verification code via SMS
                </DialogDescription>
              </DialogHeader>

              {/* Stepper Progress */}
              <div className="mt-6 mb-8">
                <Stepper
                  steps={steps}
                  currentStep={currentStepIndex}
                  orientation="vertical"
                />
              </div>

              {/* Error Alert */}
              {verificationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{verificationError}</AlertDescription>
                </Alert>
              )}

              {/* Phone Input Step */}
              {step === "phone" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex items-center rounded-lg border bg-muted px-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          +977
                        </span>
                      </div>
                      <Input
                        id="phone"
                        placeholder="9847501234"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value.replace(/\D/g, ""));
                          setVerificationError("");
                        }}
                        maxLength="10"
                        className="flex-1"
                        aria-label="Phone number"
                        aria-describedby="phone-desc"
                      />
                    </div>
                    <p
                      id="phone-desc"
                      className="text-xs text-muted-foreground"
                    >
                      Enter 10-digit phone number without country code
                    </p>
                  </div>

                  <Button
                    onClick={handleSendOTP}
                    disabled={isLoading || phoneNumber.length < 10}
                    className="w-full"
                  >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {/* OTP Input Step */}
              {step === "otp" && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm text-muted-foreground">
                      OTP sent to{" "}
                      <span className="font-semibold text-foreground">
                        +1 {phoneNumber}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="otp" className="text-sm font-medium">
                      Enter Verification Code
                    </Label>
                    <div className="flex justify-center py-4">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => {
                          setOtp(value);
                          setVerificationError("");
                        }}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot
                            index={0}
                            aria-label="First digit"
                            className="h-12 w-10 text-base sm:h-14 sm:w-12"
                          />
                          <InputOTPSlot
                            index={1}
                            aria-label="Second digit"
                            className="h-12 w-10 text-base sm:h-14 sm:w-12"
                          />
                          <InputOTPSlot
                            index={2}
                            aria-label="Third digit"
                            className="h-12 w-10 text-base sm:h-14 sm:w-12"
                          />
                          <InputOTPSlot
                            index={3}
                            aria-label="Fourth digit"
                            className="h-12 w-10 text-base sm:h-14 sm:w-12"
                          />
                          <InputOTPSlot
                            index={4}
                            aria-label="Fifth digit"
                            className="h-12 w-10 text-base sm:h-14 sm:w-12"
                          />
                          <InputOTPSlot
                            index={5}
                            aria-label="Sixth digit"
                            className="h-12 w-10 text-base sm:h-14 sm:w-12"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                      Enter the 6-digit code sent to your phone
                    </p>
                  </div>

                  <Button
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.length !== 6}
                    className="w-full"
                  >
                    {isLoading ? "Verifying..." : "Verify & Continue"}
                  </Button>

                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setStep("phone");
                        setOtp("");
                        setVerificationError("");
                      }}
                      className="w-full"
                    >
                      Change Phone Number
                    </Button>

                    {resendCount < 3 && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleSendOTP();
                          setResendCount((prev) => prev + 1);
                        }}
                        disabled={isLoading}
                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                      >
                        Didn't receive the code? Resend
                        {resendCount > 0 && ` (${resendCount}/3)`}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </>
  );
}
