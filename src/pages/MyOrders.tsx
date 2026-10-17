import React from 'react';
import { Profile } from './Profile';

/**
 * MyOrders routes to the unified Customer Portal pre-selected on the Orders & Live Tracking tab.
 */
export function MyOrders() {
  return <Profile initialTab="orders" />;
}
