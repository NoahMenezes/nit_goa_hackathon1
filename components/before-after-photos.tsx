'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface BeforeAfterPhotosProps {
  beforeUrls: string[];
  afterUrls?: string[];
  issueTitle?: string;
  status?: string;
}

export function BeforeAfterPhotos({ beforeUrls, afterUrls, issueTitle, status }: BeforeAfterPhotosProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'before' | 'after'>('before');

  const currentUrls = viewMode === 'before' ? beforeUrls : (afterUrls || []);

  const openLightbox = (url: string, index: number) => {
    setSelectedImage(url);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + currentUrls.length) % currentUrls.length
      : (currentIndex + 1) % currentUrls.length;
    
    setCurrentIndex(newIndex);
    setSelectedImage(currentUrls[newIndex]);
  };

  if (!beforeUrls || beforeUrls.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Issue Photos</CardTitle>
              <CardDescription>
                {issueTitle && `Photos for: ${issueTitle}`}
              </CardDescription>
            </div>
            {status && (
              <Badge variant={status === 'resolved' ? 'default' : 'secondary'}>
                {status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Before Photos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Before</h3>
                <Badge variant="outline">{beforeUrls.length} photo(s)</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {beforeUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => {
                      setViewMode('before');
                      openLightbox(url, index);
                    }}
                  >
                    <img
                      src={url}
                      alt={`Before photo ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 font-medium">
                        View
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* After Photos */}
            {afterUrls && afterUrls.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                    After (Resolved)
                  </h3>
                  <Badge variant="default" className="bg-green-600">
                    {afterUrls.length} photo(s)
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {afterUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => {
                        setViewMode('after');
                        openLightbox(url, index);
                      }}
                    >
                      <img
                        src={url}
                        alt={`After photo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 font-medium">
                          View
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison Note */}
            {afterUrls && afterUrls.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ This issue has been resolved! Compare the before and after photos to see the improvement.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={closeLightbox}
            >
              <X className="h-4 w-4" />
            </Button>

            {currentUrls.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigate('prev')}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigate('next')}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <div className="relative bg-black">
              <img
                src={selectedImage || ''}
                alt="Full size"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <Badge variant={viewMode === 'before' ? 'secondary' : 'default'}>
                  {viewMode === 'before' ? 'Before' : 'After (Resolved)'}
                </Badge>
                <p className="text-white text-sm mt-2">
                  Photo {currentIndex + 1} of {currentUrls.length}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
