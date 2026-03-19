import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Mail, Eye, EyeOff, Shield, Sparkles, TrendingUp, Activity, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state, default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Animated background particles effect
  useEffect(() => {
    const particles = Array.from({ length: 20 }, (_, i) => {
      const particle = document.createElement('div');
      particle.className = 'absolute w-2 h-2 rounded-full bg-primary/20 animate-float';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 3}s`;
      particle.style.animationDuration = `${3 + Math.random() * 2}s`;
      return particle;
    });

    const container = document.getElementById('particles-container');
    particles.forEach(p => container?.appendChild(p));

    return () => {
      particles.forEach(p => container?.removeChild(p));
    };
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 p-4">
      {/* Animated Background Elements */}
      <div id="particles-container" className="absolute inset-0 overflow-hidden pointer-events-none" />
      
      {/* Gradient Background - Clean White Theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.08),transparent_70%)]" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header with Enhanced Design */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
            <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-400 animate-bounce-in hover-glow">
              <Shield className="w-10 h-10 text-white animate-pulse-glow" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary animate-text-reveal">
              MINE SARTHI
            </h1>
            <p className="text-muted-foreground text-lg">Secure Access Portal</p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Activity className="w-3 h-3 text-success animate-pulse" />
              <span>Enterprise Mining Intelligence Platform</span>
            </div>
          </div>
        </div>

        {/* Enhanced Login Form */}
        <Card className="p-8 sm:p-10 glass rounded-modern-xl shadow-depth-xl border border-border backdrop-blur-xl bg-card/95 animate-scale-in hover-lift">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email Address
              </Label>
              <div className="relative group">
                <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 to-data-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm ${isFocused.email ? 'opacity-100' : ''}`} />
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${isFocused.email ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused(prev => ({ ...prev, email: true }))}
                    onBlur={() => setIsFocused(prev => ({ ...prev, email: false }))}
                    className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-success/50 transition-all duration-300"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Password
              </Label>
              <div className="relative group">
                <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 to-success/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm ${isFocused.password ? 'opacity-100' : ''}`} />
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${isFocused.password ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                    onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                    className="pl-12 pr-12 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-success/50 transition-all duration-300"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/10 rounded-lg transition-all duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2 border-red-500/50 bg-red-500/10 backdrop-blur-sm">
                <AlertDescription className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary hover:via-primary/95 hover:to-primary shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-400 relative overflow-hidden group hover-shine"
              disabled={isLoading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Button>
          </form>

          {/* Additional Features */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>AI-Powered Security</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Security Notice */}
        <div className="text-center space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-primary" />
              <span>Enterprise-grade encryption</span>
            </div>
            <span className="mx-2">•</span>
            <div className="flex items-center gap-1">
              <Lock className="w-4 h-4 text-success" />
              <span>Role-based access control</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Protected by advanced security protocols and multi-factor authentication
          </p>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-3 h-3 bg-success/40 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-20 w-2 h-2 bg-data-blue/40 rounded-full animate-float" style={{ animationDelay: '2s' }} />
    </div>
  );
};

export default Login;
