"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Illustration from "@/components/auth/ui/Illustration";
import zxcvbn from "zxcvbn";

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
];

function PasswordStrengthBar({ score }: { score: number }) {
  return (
    <div className="space-y-1" aria-label={`Password strength: ${STRENGTH_LABELS[score]}`}>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= score ? STRENGTH_COLORS[score] : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{STRENGTH_LABELS[score]}</p>
    </div>
  );
}

export default function NewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<number>(-1);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters long");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      // TODO: Implement password reset logic
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
      setStatus("success");
      setMessage("Password has been reset successfully.");
    } catch (error) {
      setStatus("error");
      setMessage("Failed to reset password. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col items-center justify-center px-4 md:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center space-x-2">
            <Image
              src="/img/logo.png"
              alt="TrueStub"
              width={32}
              height={32}
              style={{ width: "auto", height: "auto" }}
            />
            <h1 className="text-2xl font-bold">TrueStub</h1>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold">Create New Password</h2>
            <p className="text-sm text-muted-foreground">
              Please enter your new password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordStrength(e.target.value ? zxcvbn(e.target.value).score : -1);
                }}
                required
                minLength={8}
              />
              {passwordStrength >= 0 && (
                <PasswordStrengthBar score={passwordStrength} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {message && (
              <Alert variant={status === "error" ? "destructive" : "default"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-[#2857B8] hover:bg-[#2857B8]/90"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Password...
                </>
              ) : (
                "Set New Password"
              )}
            </Button>

            <div className="text-center text-sm">
              <Link href="/login" className="text-[#2857B8] hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>

      <Illustration />
    </div>
  );
}
