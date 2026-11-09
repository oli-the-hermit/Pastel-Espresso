import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  value: string;
  label: string;
}

/** A number and what it counts: the value leads, the label explains it. */
export const StatCard: React.FC<StatCardProps> = ({ value, label }) => {
  return (
    <Card className="stat-card">
      <div className="stat-card-val">{value}</div>
      <div className="stat-card-lbl">{label}</div>
    </Card>
  );
};
