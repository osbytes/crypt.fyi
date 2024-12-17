import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';

type DragState = 'none' | 'dragging' | 'invalid';

interface DragAndDropProps {
  children: ReactNode;
  onFileDrop?: (file: File) => void;
  className?: string;
}

function isDragEventWithFiles(event: DragEvent) {
  if (!event.dataTransfer?.types) return false;
  return event.dataTransfer.types.includes('Files');
}

export function DragAndDrop({ children, onFileDrop, className }: DragAndDropProps) {
  const [dragState, setDragState] = useState<DragState>('none');

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragEventWithFiles(e.nativeEvent)) {
      setDragState('dragging');
    } else {
      setDragState('invalid');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState('none');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragEventWithFiles(e.nativeEvent)) {
      setDragState('dragging');
    } else {
      setDragState('invalid');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState('none');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileDrop?.(files[0]);
    }
  };

  return (
    <div
      className={cn('min-h-screen', className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {dragState !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'fixed inset-0 border-2 border-dashed z-50 flex items-center justify-center backdrop-blur-sm',
              dragState === 'dragging'
                ? 'border-primary bg-primary/5'
                : 'border-destructive bg-destructive/5',
            )}
          >
            <p
              className={cn(
                'text-2xl font-medium',
                dragState === 'dragging' ? 'text-primary' : 'text-destructive',
              )}
            >
              {dragState === 'dragging' ? 'Drop file here' : 'Invalid file type'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}
