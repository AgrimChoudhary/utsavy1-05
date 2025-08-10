import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, X, ArrowLeft, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ui/image-upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import Logo from '@/components/ui/Logo';

interface EditDialogProps {
  title: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: string;
  placeholder?: string;
}

const EditDialog = ({ title, value, onSave, type = "text", placeholder }: EditDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newValue, setNewValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(newValue);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="ml-auto">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            type={type}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={placeholder}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) return null;

  // Get user initials for avatar
  const getInitials = () => {
    const name = user.user_metadata?.name || user.email || '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const updateUserMetadata = async (key: string, value: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          [key]: value
        }
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Your profile has been updated.",
        });
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handlePhotoChange = async (url: string) => {
    try {
      setIsPhotoUploading(true);
      await updateUserMetadata('avatar_url', url);
    } catch (error) {
      console.error('Error updating photo:', error);
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (confirmed) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) throw error;

        toast({
          title: "Account Deleted",
          description: "Your account has been successfully deleted.",
        });

        navigate('/');
      } catch (error: any) {
        console.error('Error deleting account:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete account",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <Logo />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-8">
                <Avatar className="h-24 w-24 ring-4 ring-gray-100">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white text-2xl font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <ImageUpload
                    value={user.user_metadata?.avatar_url}
                    onChange={handlePhotoChange}
                    bucket="images"
                    folder="avatars"
                    maxSize={2}
                    className="mb-2"
                  />
                  <p className="text-sm text-gray-500">Recommended: Square image, at least 400x400px</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-gray-900">{user.user_metadata?.name || 'Not set'}</p>
                  </div>
                  <EditDialog
                    title="Name"
                    value={user.user_metadata?.name || ''}
                    onSave={(value) => updateUserMetadata('name', value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <EditDialog
                    title="Email"
                    value={user.email || ''}
                    type="email"
                    onSave={async (value) => {
                      const { error } = await supabase.auth.updateUser({ email: value });
                      if (error) throw error;
                      toast({
                        title: "Verification email sent",
                        description: "Please check your email to verify the new address.",
                      });
                    }}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-900">{user.user_metadata?.mobile_number || 'Not set'}</p>
                  </div>
                  <EditDialog
                    title="Phone"
                    value={user.user_metadata?.mobile_number || ''}
                    type="tel"
                    onSave={(value) => updateUserMetadata('mobile_number', value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDeleteAccount}
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;