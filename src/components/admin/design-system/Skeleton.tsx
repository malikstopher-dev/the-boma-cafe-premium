'use client'

import styles from './DesignSystem.module.css'

export function Skeleton({ width, height, className = '' }: {
  width?: string | number
  height?: string | number
  className?: string
}) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonText({ width = '100%' }: { width?: string | number }) {
  return <Skeleton width={width} height={14} className={styles.skeletonText} />
}

export function SkeletonTextSm({ width = '60%' }: { width?: string | number }) {
  return <Skeleton width={width} height={12} className={styles.skeletonTextSm} />
}

export function SkeletonTextLg({ width = '40%' }: { width?: string | number }) {
  return <Skeleton width={width} height={20} className={styles.skeletonTextLg} />
}

export function SkeletonCircle({ size }: { size: number }) {
  return <Skeleton width={size} height={size} className={styles.skeletonCircle} />
}

export function SkeletonCard() {
  return <Skeleton className={styles.skeletonCard} />
}

export function SkeletonStatCard() {
  return (
    <div className={styles.statCard}>
      <Skeleton width="60%" height={32} />
      <SkeletonTextSm width="40%" />
    </div>
  )
}
