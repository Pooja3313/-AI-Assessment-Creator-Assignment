"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    // Simulate signup
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Account created!",
        description: "You have been registered successfully.",
        variant: "success",
      });
      router.push("/assignments");
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-indigo-50/30 to-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#4F46E5] text-white font-bold text-2xl shadow-lg mb-4 animate-float">
            V
          </div>
          <h1 className="text-3xl font-bold text-[#0F172A]">VedaAI</h1>
          <p className="text-[#64748B] mt-1">Create your account</p>
        </div>

        <Card className="border border-[#E2E8F0] shadow-xl rounded-2xl">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl text-[#0F172A] text-center">
              Sign Up
            </CardTitle>
            <p className="text-sm text-[#64748B] text-center mt-1">
              Create your teacher account
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[#0F172A]">
                  Full Name
                </Label>
                <Input
                  type="text"
                  placeholder="Ms. Sharma"
                  className="h-11 border-[#E2E8F0] rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[#0F172A]">
                  Email
                </Label>
                <Input
                  type="email"
                  placeholder="teacher@school.com"
                  className="h-11 border-[#E2E8F0] rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-[#0F172A]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    className="h-11 border-[#E2E8F0] rounded-xl pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-[#EF4444] bg-red-50 p-3 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 gap-2 bg-[#0F172A] hover:bg-[#4F46E5] text-white rounded-xl font-semibold transition-all hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-[#64748B]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[#0F172A] font-semibold hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}