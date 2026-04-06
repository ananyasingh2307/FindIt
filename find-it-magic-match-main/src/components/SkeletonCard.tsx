import React from "react";

const SkeletonCard = () => (
  <div className="bento-card-flat space-y-4">
    <div className="h-36 rounded-xl skeleton-shimmer" />
    <div className="h-4 w-3/4 rounded-lg skeleton-shimmer" />
    <div className="h-3 w-1/2 rounded-lg skeleton-shimmer" />
    <div className="flex gap-2">
      <div className="h-6 w-16 rounded-full skeleton-shimmer" />
      <div className="h-6 w-20 rounded-full skeleton-shimmer" />
    </div>
  </div>
);

export default SkeletonCard;
