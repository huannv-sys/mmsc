import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { LoadingAnimation } from './loading-animation';
import { SkeletonPulse } from './skeleton-pulse';

interface ContentWrapperProps {
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  children: React.ReactNode;
  loadingContent?: React.ReactNode;
  retry?: () => void;
}

export function ContentWrapper({
  isLoading,
  isError = false,
  errorMessage = 'Có lỗi xảy ra khi tải dữ liệu',
  children,
  loadingContent,
  retry
}: ContentWrapperProps) {
  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {loadingContent || (
              <div className="flex flex-col items-center justify-center min-h-[200px] p-6 space-y-4">
                <LoadingAnimation variant="dots" text="Đang tải dữ liệu..." />
              </div>
            )}
          </motion.div>
        )}
        
        {isError && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full flex flex-col items-center justify-center min-h-[200px] p-6 space-y-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center"
            >
              <p className="text-red-600 dark:text-red-400 mb-3">{errorMessage}</p>
              {retry && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium"
                  onClick={retry}
                >
                  Thử lại
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
        
        {!isLoading && !isError && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface SkeletonDataTableProps {
  rows?: number;
  columns?: number;
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  children: React.ReactNode;
  className?: string;
  retry?: () => void;
}

export function SkeletonDataTable({
  rows = 5,
  columns = 4,
  isLoading,
  isError = false,
  errorMessage = 'Có lỗi xảy ra khi tải dữ liệu',
  children,
  className,
  retry
}: SkeletonDataTableProps) {
  const renderTableSkeleton = () => (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between">
        <SkeletonPulse width={200} height={24} />
        <SkeletonPulse width={120} height={20} />
      </div>
      
      <div className="mt-4 border rounded-md overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 p-2">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <SkeletonPulse key={i} height={16} />
            ))}
          </div>
        </div>
        
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="p-2">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <SkeletonPulse 
                    key={colIndex} 
                    height={16} 
                    width={colIndex === 0 ? "80%" : colIndex === columns - 1 ? "40%" : "60%"}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  return (
    <ContentWrapper
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      loadingContent={renderTableSkeleton()}
      retry={retry}
    >
      {children}
    </ContentWrapper>
  );
}

interface SkeletonCardGridProps {
  cards?: number;
  cardHeight?: string;
  cols?: number;
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  children: React.ReactNode;
  className?: string;
  retry?: () => void;
}

export function SkeletonCardGrid({
  cards = 4,
  cardHeight = "180px",
  cols = 2,
  isLoading,
  isError = false,
  errorMessage = 'Có lỗi xảy ra khi tải dữ liệu',
  children,
  className,
  retry
}: SkeletonCardGridProps) {
  const renderCardsSkeleton = () => (
    <div className={cn(`grid gap-4 grid-cols-1 md:grid-cols-${cols}`, className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4" style={{ height: cardHeight }}>
          <div className="space-y-4 h-full flex flex-col">
            <SkeletonPulse width={150} height={24} />
            <SkeletonPulse width={100} height={16} />
            <div className="flex-1 flex items-center justify-center">
              <SkeletonPulse width="80%" height={60} />
            </div>
            <div className="flex justify-between">
              <SkeletonPulse width={80} height={20} />
              <SkeletonPulse width={40} height={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <ContentWrapper
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      loadingContent={renderCardsSkeleton()}
      retry={retry}
    >
      {children}
    </ContentWrapper>
  );
}

interface SkeletonDetailViewProps {
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  children: React.ReactNode;
  className?: string;
  retry?: () => void;
}

export function SkeletonDetailView({
  isLoading,
  isError = false,
  errorMessage = 'Có lỗi xảy ra khi tải dữ liệu',
  children,
  className,
  retry
}: SkeletonDetailViewProps) {
  const renderDetailSkeleton = () => (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonPulse width={300} height={32} />
          <SkeletonPulse width={200} height={16} />
        </div>
        <SkeletonPulse width={100} height={36} borderRadius="9999px" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-5 space-y-4">
          <SkeletonPulse width={120} height={20} />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <SkeletonPulse width={120} height={16} />
                <SkeletonPulse width={150} height={16} />
              </div>
            ))}
          </div>
        </div>
        
        <div className="border rounded-lg p-5 space-y-4">
          <SkeletonPulse width={150} height={20} />
          <div className="space-y-3">
            <SkeletonPulse height={120} />
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg p-5 space-y-4">
        <SkeletonPulse width={180} height={20} />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonPulse key={i} height={16} />
          ))}
        </div>
      </div>
    </div>
  );
  
  return (
    <ContentWrapper
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      loadingContent={renderDetailSkeleton()}
      retry={retry}
    >
      {children}
    </ContentWrapper>
  );
}