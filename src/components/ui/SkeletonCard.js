import React from 'react';
import Skeleton from './Skeleton';

/**
 * Skeleton Card Component
 * Displays a card-like skeleton for match/profile cards
 */
const SkeletonCard = () => {
  return (
    <div className="p-4 bg-white rounded-xl border border-[#F9E6CA] animate-pulse">
      <div className="flex items-center space-x-3 mb-3">
        <Skeleton variant="avatar" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="60%" />
          <Skeleton height={14} width="40%" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height={12} />
        <Skeleton height={12} width="80%" />
        <Skeleton height={12} width="90%" />
      </div>
    </div>
  );
};

export default SkeletonCard;

