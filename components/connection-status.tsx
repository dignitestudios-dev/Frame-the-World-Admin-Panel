'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowDialog(false);

      if (wasOffline) {
        toast.success('Internet Connection Restored', {
          description: 'You are back online',
          icon: <Wifi className="h-5 w-5 text-green-500" />,
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowDialog(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return (
    <AlertDialog open={showDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="bg-red-100 p-3 rounded-lg">
              <WifiOff className="h-6 w-6 text-red-600" />
            </div>
          </div>

          <AlertDialogTitle>No Internet Connection</AlertDialogTitle>

          <AlertDialogDescription>
            You appear to be offline. Please check your internet connection and try again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            variant="secondary"
            className='text-white'
            onClick={() => setShowDialog(false)}
          >
            Close
          </Button>

          <Button variant="outline" disabled>
            Waiting for connection...
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}