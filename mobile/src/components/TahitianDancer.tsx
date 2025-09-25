import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';

interface TahitianDancerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  color?: 'primary' | 'sunset' | 'coral' | 'ocean';
  style?: any;
}

const TahitianDancer: React.FC<TahitianDancerProps> = ({ 
  size = 'md', 
  animate = false, 
  color = 'primary',
  style = {} 
}) => {
  const sizeStyles = {
    sm: { width: 32, height: 32 },
    md: { width: 64, height: 64 },
    lg: { width: 96, height: 96 },
    xl: { width: 128, height: 128 }
  };

  const colors = {
    primary: '#0891b2',
    sunset: '#f97316',
    coral: '#f97316',
    ocean: '#0369a1'
  };

  return (
    <View style={[sizeStyles[size], style]}>
      <Svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
      >
        {/* Traditional Tahitian dancer silhouette */}
        <G>
          {/* Head */}
          <Circle cx="50" cy="15" r="8" fill={colors[color]} />
          
          {/* Traditional headdress */}
          <Path d="M42 7 Q50 2 58 7 Q56 5 54 6 Q52 4 50 5 Q48 4 46 6 Q44 5 42 7" fill={colors[color]} />
          
          {/* Body */}
          <Path d="M44 23 Q50 21 56 23 L56 47 Q50 49 44 47 Z" fill={colors[color]} />
          
          {/* Arms in traditional dance position */}
          <Path d="M44 28 Q38 25 35 30 Q37 32 40 30 Q42 32 44 30" fill={colors[color]} />
          <Path d="M56 28 Q62 25 65 30 Q63 32 60 30 Q58 32 56 30" fill={colors[color]} />
          
          {/* Traditional grass skirt */}
          <Path d="M44 47 Q50 45 56 47 L58 65 Q56 68 54 65 L52 68 Q50 65 48 68 L46 65 Q44 68 42 65 Z" fill={colors[color]} />
          
          {/* Flowing skirt details */}
          <Path d="M45 50 L43 70 M47 50 L45 72 M49 50 L49 72 M51 50 L53 72 M53 50 L55 70 M55 50 L57 68" 
                stroke={colors[color]} 
                strokeWidth="1" 
                fill="none" 
                opacity="0.7" />
          
          {/* Legs in dance position */}
          <Path d="M46 65 Q44 75 42 85 Q44 87 46 85 Q48 87 46 89" fill={colors[color]} />
          <Path d="M54 65 Q56 75 58 85 Q56 87 54 85 Q52 87 54 89" fill={colors[color]} />
          
          {/* Traditional ankle decorations */}
          <Circle cx="44" cy="87" r="2" fill={colors[color]} opacity="0.8" />
          <Circle cx="56" cy="87" r="2" fill={colors[color]} opacity="0.8" />
          
          {/* Hair flowing */}
          <Path d="M42 15 Q38 18 36 22 Q38 20 40 18" fill={colors[color]} opacity="0.6" />
          <Path d="M58 15 Q62 18 64 22 Q62 20 60 18" fill={colors[color]} opacity="0.6" />
        </G>
        
        {/* Animated elements for movement */}
        {animate && (
          <G>
            {/* Flowing fabric animation */}
            <Path d="M42 65 Q40 70 38 75" 
                  stroke={colors[color]} 
                  strokeWidth="2" 
                  fill="none" 
                  opacity="0.4" />
            <Path d="M58 65 Q60 70 62 75" 
                  stroke={colors[color]} 
                  strokeWidth="2" 
                  fill="none" 
                  opacity="0.4" />
          </G>
        )}
      </Svg>
    </View>
  );
};

export default TahitianDancer;

// Traditional Tahitian dancer in different poses
export const DancerPoses = {
  // Otea pose - energetic hip movement
  Otea: ({ size = 'md', style = {} }: Omit<TahitianDancerProps, 'animate' | 'color'>) => {
    const sizeStyles = {
      sm: { width: 32, height: 32 },
      md: { width: 64, height: 64 },
      lg: { width: 96, height: 96 },
      xl: { width: 128, height: 128 }
    };
    return (
      <View style={[sizeStyles[size], style]}>
        <Svg viewBox="0 0 100 100" width="100%" height="100%">
          <G>
            <Circle cx="50" cy="15" r="8" fill="#f97316" />
            <Path d="M42 7 Q50 2 58 7 Q56 5 54 6 Q52 4 50 5 Q48 4 46 6 Q44 5 42 7" fill="#f97316" />
            <Path d="M44 23 Q50 21 56 23 L56 47 Q50 49 44 47 Z" fill="#f97316" />
            <Path d="M44 28 Q35 22 30 28 Q32 30 38 28 Q42 30 44 32" fill="#f97316" />
            <Path d="M56 28 Q65 22 70 28 Q68 30 62 28 Q58 30 56 32" fill="#f97316" />
            <Path d="M44 47 Q50 45 56 47 L60 65 Q58 68 56 65 L54 68 Q50 65 46 68 L44 65 Q42 68 40 65 Z" fill="#f97316" />
            <Path d="M46 65 Q42 75 38 85 Q40 87 42 85 Q44 87 42 89" fill="#f97316" />
            <Path d="M54 65 Q58 75 62 85 Q60 87 58 85 Q56 87 58 89" fill="#f97316" />
          </G>
        </Svg>
      </View>
    );
  },
  
  // Aparima pose - storytelling dance
  Aparima: ({ size = 'md', style = {} }: Omit<TahitianDancerProps, 'animate' | 'color'>) => {
    const sizeStyles = {
      sm: { width: 32, height: 32 },
      md: { width: 64, height: 64 },
      lg: { width: 96, height: 96 },
      xl: { width: 128, height: 128 }
    };
    return (
      <View style={[sizeStyles[size], style]}>
        <Svg viewBox="0 0 100 100" width="100%" height="100%">
          <G>
            <Circle cx="50" cy="15" r="8" fill="#f97316" />
            <Path d="M42 7 Q50 2 58 7 Q56 5 54 6 Q52 4 50 5 Q48 4 46 6 Q44 5 42 7" fill="#f97316" />
            <Path d="M44 23 Q50 21 56 23 L56 47 Q50 49 44 47 Z" fill="#f97316" />
            <Path d="M44 28 Q40 20 42 15 Q45 18 44 25" fill="#f97316" />
            <Path d="M56 28 Q60 20 58 15 Q55 18 56 25" fill="#f97316" />
            <Path d="M44 47 Q50 45 56 47 L58 65 Q56 68 54 65 L52 68 Q50 65 48 68 L46 65 Q44 68 42 65 Z" fill="#f97316" />
            <Path d="M46 65 Q46 75 46 85 Q48 87 46 85 Q44 87 46 89" fill="#f97316" />
            <Path d="M54 65 Q54 75 54 85 Q52 87 54 85 Q56 87 54 89" fill="#f97316" />
          </G>
        </Svg>
      </View>
    );
  }
};