import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarUpload } from '@/components/AvatarUpload';
import { ArrowLeft, ArrowRight, Calendar, Phone, User, Mail, Loader2, Check, Zap } from 'lucide-react';

interface SignUpData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  phoneNumber: string;
  avatarUrl?: string;
}

const SignUp = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [data, setData] = useState<SignUpData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    dateOfBirth: '',
    phoneNumber: '',
  });

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalSteps = 6;

  const updateData = (field: keyof SignUpData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const sendOtp = async () => {
    setIsLoading(true);
    try {
      // In real implementation, you would integrate with a service like Twilio
      // For now, we'll simulate OTP sending
      setTimeout(() => {
        setIsOtpSent(true);
        setIsLoading(false);
        toast({
          title: "OTP Sent",
          description: `Verification code sent to ${data.phoneNumber}`
        });
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send OTP. Please try again."
      });
    }
  };

  const verifyOtp = async () => {
    setIsLoading(true);
    try {
      // Simulate OTP verification (in real app, verify with backend)
      if (otp === '123456') {
        setIsLoading(false);
        nextStep();
        toast({
          title: "Phone Verified",
          description: "Your phone number has been verified successfully!"
        });
      } else {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Invalid OTP",
          description: "Please check the code and try again."
        });
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify OTP. Please try again."
      });
    }
  };

  const completeSignUp = async () => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, {
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username,
        date_of_birth: data.dateOfBirth,
        phone_number: data.phoneNumber,
        avatar_url: data.avatarUrl
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
          description: "Your account has been created successfully!"
        });
        navigate('/');
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

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return data.firstName.trim() !== '' && data.lastName.trim() !== '';
      case 2:
        return data.username.trim() !== '' && data.email.trim() !== '' && data.password.length >= 6;
      case 3:
        return data.dateOfBirth !== '';
      case 4:
        return data.phoneNumber.trim() !== '';
      case 5:
        return isOtpSent && otp.length === 6;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center px-4 py-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-social rounded-full blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-4 -left-4 w-96 h-96 bg-gradient-social rounded-full blur-3xl opacity-10 animate-float" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Create Account
          </h1>
          <p className="text-white/70 text-sm">
            Step {currentStep} of {totalSteps}
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mt-4">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="glass-panel border-white/20 bg-white/5">
          <CardContent className="p-6">
            {/* Step 1: Name */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <User className="w-12 h-12 text-white mx-auto mb-3" />
                  <CardTitle className="text-white text-xl mb-2">What's your name?</CardTitle>
                  <CardDescription className="text-white/70">
                    Tell us what to call you
                  </CardDescription>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">First Name</Label>
                    <Input
                      value={data.firstName}
                      onChange={(e) => updateData('firstName', e.target.value)}
                      placeholder="Enter your first name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Last Name</Label>
                    <Input
                      value={data.lastName}
                      onChange={(e) => updateData('lastName', e.target.value)}
                      placeholder="Enter your last name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Username & Credentials */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Mail className="w-12 h-12 text-white mx-auto mb-3" />
                  <CardTitle className="text-white text-xl mb-2">Account Details</CardTitle>
                  <CardDescription className="text-white/70">
                    Choose your username and credentials
                  </CardDescription>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Username</Label>
                    <Input
                      value={data.username}
                      onChange={(e) => updateData('username', e.target.value.toLowerCase())}
                      placeholder="@username"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Email</Label>
                    <Input
                      type="email"
                      value={data.email}
                      onChange={(e) => updateData('email', e.target.value)}
                      placeholder="your@email.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Password</Label>
                    <Input
                      type="password"
                      value={data.password}
                      onChange={(e) => updateData('password', e.target.value)}
                      placeholder="Create a password"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Date of Birth */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-white mx-auto mb-3" />
                  <CardTitle className="text-white text-xl mb-2">When were you born?</CardTitle>
                  <CardDescription className="text-white/70">
                    This helps us show you age-appropriate content
                  </CardDescription>
                </div>
                <div>
                  <Label className="text-white">Date of Birth</Label>
                  <Input
                    type="date"
                    value={data.dateOfBirth}
                    onChange={(e) => updateData('dateOfBirth', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Phone Number */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Phone className="w-12 h-12 text-white mx-auto mb-3" />
                  <CardTitle className="text-white text-xl mb-2">Your phone number</CardTitle>
                  <CardDescription className="text-white/70">
                    We'll send you a verification code
                  </CardDescription>
                </div>
                <div>
                  <Label className="text-white">Phone Number</Label>
                  <Input
                    type="tel"
                    value={data.phoneNumber}
                    onChange={(e) => updateData('phoneNumber', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
            )}

            {/* Step 5: OTP Verification */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Phone className="w-12 h-12 text-white mx-auto mb-3" />
                  <CardTitle className="text-white text-xl mb-2">Verify your number</CardTitle>
                  <CardDescription className="text-white/70">
                    {isOtpSent ? `Enter the code sent to ${data.phoneNumber}` : 'We\'ll send a verification code'}
                  </CardDescription>
                </div>
                
                {!isOtpSent ? (
                  <Button
                    onClick={sendOtp}
                    disabled={isLoading}
                    className="w-full bg-white text-primary hover:bg-white/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Verification Code</Label>
                      <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center text-2xl tracking-wider"
                      />
                    </div>
                    <p className="text-white/60 text-sm text-center">
                      For demo purposes, use: 123456
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Avatar Upload */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl mb-2">Add your photo</CardTitle>
                  <CardDescription className="text-white/70">
                    Help others recognize you (optional)
                  </CardDescription>
                </div>
                
                <div className="flex flex-col items-center">
                  <AvatarUpload
                    currentAvatarUrl={data.avatarUrl}
                    onAvatarChange={(url) => updateData('avatarUrl', url || '')}
                    userId={data.username} // Use username as temp ID
                  />
                  
                  {data.avatarUrl && (
                    <div className="flex items-center gap-2 text-white/70 text-sm mt-4">
                      <Check className="h-4 w-4 text-green-400" />
                      Profile photo added
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={currentStep === 5 && isOtpSent ? verifyOtp : nextStep}
                  disabled={!canProceedFromStep(currentStep) || isLoading}
                  className={`${currentStep === 1 ? 'w-full' : 'flex-1'} bg-white text-primary hover:bg-white/90`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <>
                      {currentStep === 5 && isOtpSent ? 'Verify Code' : 'Continue'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={completeSignUp}
                  disabled={isLoading}
                  className={`${currentStep === 1 ? 'w-full' : 'flex-1'} bg-white text-primary hover:bg-white/90`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Complete Sign Up'
                  )}
                </Button>
              )}
            </div>
            
            {/* Skip option for avatar */}
            {currentStep === 6 && (
              <Button
                variant="ghost"
                onClick={completeSignUp}
                disabled={isLoading}
                className="w-full mt-2 text-white/70 hover:bg-white/5"
              >
                Skip for now
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/auth')}
              className="text-white hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;