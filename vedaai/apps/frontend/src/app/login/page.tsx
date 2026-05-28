"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Welcome back!", description: "Logged in successfully.", variant: "success" });
      router.push("/assignments");
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadeInUp">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white font-bold text-2xl shadow-lg mb-4 animate-float">V</div>
          <h1 className="text-3xl font-bold text-gray-900">VedaAI</h1>
          <p className="text-gray-500 mt-1">Assessment Creator</p>
        </div>

        <Card className="border border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl text-gray-900 text-center">Sign In</CardTitle>
            <p className="text-sm text-gray-500 text-center mt-1">Welcome back! Please enter your credentials</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Email</Label>
                <Input type="email" placeholder="teacher@school.com" className="h-11 border-gray-200 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="password" className="h-11 border-gray-200 rounded-xl pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full h-11 gap-2 bg-black hover:bg-gray-800 text-white rounded-xl font-semibold transition-all hover:scale-[1.02]">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : <><LogIn className="h-4 w-4" /> Sign In</>}
              </Button>
              <p className="text-center text-sm text-gray-500">
                {"Don't have an account? "}
                <Link href="/signup" className="text-black font-semibold hover:underline">Sign Up</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}