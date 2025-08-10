
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  placeholder?: string;
}

export const ImageUpload = ({
  value,
  onChange,
  bucket = 'images',
  folder = 'uploads',
  accept = 'image/*',
  maxSize = 5,
  className = '',
  placeholder = 'Upload image'
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Please select an image smaller than ${maxSize}MB`,
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      console.log('Uploading to bucket:', bucket, 'with path:', filePath);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('File uploaded successfully to:', publicUrl);
      
      setPreview(publicUrl);
      onChange(publicUrl);

      toast({
        title: 'Image uploaded successfully',
        description: 'Your image has been uploaded and saved.'
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
  };

  // Generate unique ID for input to avoid conflicts
  const inputId = `image-upload-${Math.random().toString(36).substring(2)}`;

  return (
    <div className={`space-y-2 ${className}`}>
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-2">{placeholder}</p>
        </div>
      )}
      
      <div className="flex gap-2">
        <Label htmlFor={inputId} className="cursor-pointer flex-1">
          <Input
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
          <Button 
            type="button" 
            variant="outline" 
            disabled={isUploading} 
            className="w-full"
            asChild
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Choose Image'}
            </span>
          </Button>
        </Label>
      </div>
    </div>
  );
};
