import React from 'react';
import {
  Utensils,
  ShoppingCart,
  Home,
  Zap,
  Droplets,
  Smartphone,
  Wifi,
  Bus,
  Fuel,
  Stethoscope,
  GraduationCap,
  ShoppingBag,
  Film,
  Landmark,
  RotateCw,
  Tag,
  Wallet,
  Store,
  Laptop,
  PiggyBank,
  TrendingUp,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

interface Props extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<Props> = ({ name, ...props }) => {
  switch (name) {
    case 'Utensils':
    case 'restaurant':
      return <Utensils {...props} />;
    case 'ShoppingCart':
    case 'shopping_cart':
      return <ShoppingCart {...props} />;
    case 'Home':
    case 'home':
      return <Home {...props} />;
    case 'Zap':
    case 'bolt':
      return <Zap {...props} />;
    case 'Droplets':
    case 'water_drop':
      return <Droplets {...props} />;
    case 'Smartphone':
    case 'phone_android':
      return <Smartphone {...props} />;
    case 'Wifi':
    case 'wifi':
      return <Wifi {...props} />;
    case 'Bus':
    case 'directions_bus':
      return <Bus {...props} />;
    case 'Fuel':
    case 'local_gas_station':
      return <Fuel {...props} />;
    case 'Stethoscope':
    case 'medical_services':
      return <Stethoscope {...props} />;
    case 'GraduationCap':
    case 'school':
      return <GraduationCap {...props} />;
    case 'ShoppingBag':
    case 'shopping_bag':
      return <ShoppingBag {...props} />;
    case 'Film':
    case 'movie':
      return <Film {...props} />;
    case 'Landmark':
    case 'account_balance':
      return <Landmark {...props} />;
    case 'RotateCw':
    case 'subscriptions':
      return <RotateCw {...props} />;
    case 'Wallet':
    case 'payments':
      return <Wallet {...props} />;
    case 'Store':
    case 'store':
      return <Store {...props} />;
    case 'Laptop':
    case 'laptop':
      return <Laptop {...props} />;
    case 'PiggyBank':
    case 'savings':
      return <PiggyBank {...props} />;
    case 'TrendingUp':
    case 'trending_up':
      return <TrendingUp {...props} />;
    default:
      return <Tag {...props} />;
  }
};
