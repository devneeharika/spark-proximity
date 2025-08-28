import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Users, MessageCircle, Zap } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });
  
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: error.message || "Failed to sign in. Please try again."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Error",
        description: "An unexpected error occurred."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signUp(formData.email, formData.password, {
        username: formData.username,
        display_name: formData.displayName
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign Up Failed", 
          description: error.message || "Failed to create account. Please try again."
        });
      } else {
        toast({
          title: "Welcome to Spark! ✨",
          description: "Your account has been created. Let's get started!"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error", 
        description: "An unexpected error occurred."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center px-4 py-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-social rounded-full blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-4 -left-4 w-96 h-96 bg-gradient-social rounded-full blur-3xl opacity-10 animate-float" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Hero Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-social rounded-2xl mb-6 shadow-glow">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-social bg-clip-text text-transparent mb-2">
            Spark
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect with people around you
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="text-center p-4 rounded-xl bg-card/50 backdrop-blur-sm border">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Discover Nearby</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card/50 backdrop-blur-sm border">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Make Connections</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card/50 backdrop-blur-sm border">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Start Chatting</p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="backdrop-blur-xl bg-card/80 shadow-2xl border-0 animate-scale-in" style={{animationDelay: '0.4s'}}>
          <CardContent className="p-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <CardHeader className="px-0 pb-4">
                <CardTitle className="text-center">Welcome Back</CardTitle>
                <CardDescription className="text-center">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-social hover:shadow-glow transition-all duration-300 text-white font-medium" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6 animate-fade-in" style={{animationDelay: '0.6s'}}>
          By continuing, you agree to our Terms & Privacy Policy
        </p>

        {/* Sign Up Link */}
        <div className="text-center mt-4">
          <p className="text-muted-foreground text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-primary hover:underline font-medium"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;