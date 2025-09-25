import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Line, Circle, Ellipse } from 'react-native-svg';

interface PatternProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'sunset' | 'coral' | 'ocean';
  style?: any;
}

// Traditional Tahitian Tapa pattern
export const TapaPattern: React.FC<PatternProps> = ({ 
  size = 'md', 
  color = 'primary',
  style = {} 
}) => {
  const sizeStyles = {
    sm: { width: 48, height: 48 },
    md: { width: 80, height: 80 },
    lg: { width: 128, height: 128 }
  };

  const colors = {
    primary: '#0891b2',
    sunset: '#f97316',
    coral: '#f97316',
    ocean: '#0369a1'
  };

  return (
    <View style={[sizeStyles[size], style]}>
      <Svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* Traditional Tapa bark cloth pattern */}
        <G>
          {/* Central diamond motif */}
          <Path d="M50 20 L70 50 L50 80 L30 50 Z" fill="none" stroke={colors[color]} strokeWidth="2" />
          
          {/* Inner geometric patterns */}
          <Path d="M50 30 L60 50 L50 70 L40 50 Z" fill={colors[color]} opacity="0.3" />
          
          {/* Traditional triangular elements */}
          <Path d="M50 10 L55 20 L45 20 Z" fill={colors[color]} />
          <Path d="M50 90 L55 80 L45 80 Z" fill={colors[color]} />
          <Path d="M20 50 L30 45 L30 55 Z" fill={colors[color]} />
          <Path d="M80 50 L70 45 L70 55 Z" fill={colors[color]} />
          
          {/* Decorative lines */}
          <Line x1="30" y1="30" x2="70" y2="30" stroke={colors[color]} strokeWidth="1" opacity="0.6" />
          <Line x1="30" y1="70" x2="70" y2="70" stroke={colors[color]} strokeWidth="1" opacity="0.6" />
          <Line x1="30" y1="30" x2="30" y2="70" stroke={colors[color]} strokeWidth="1" opacity="0.6" />
          <Line x1="70" y1="30" x2="70" y2="70" stroke={colors[color]} strokeWidth="1" opacity="0.6" />
          
          {/* Corner decorations */}
          <Circle cx="30" cy="30" r="3" fill={colors[color]} opacity="0.8" />
          <Circle cx="70" cy="30" r="3" fill={colors[color]} opacity="0.8" />
          <Circle cx="30" cy="70" r="3" fill={colors[color]} opacity="0.8" />
          <Circle cx="70" cy="70" r="3" fill={colors[color]} opacity="0.8" />
        </G>
      </Svg>
    </View>
  );
};

// Traditional wave pattern (representing ocean)
export const WavePattern: React.FC<PatternProps> = ({ 
  size = 'md', 
  color = 'ocean',
  style = {} 
}) => {
  const sizeStyles = {
    sm: { width: 64, height: 32 },
    md: { width: 96, height: 48 },
    lg: { width: 160, height: 80 }
  };

  const colors = {
    primary: '#0891b2',
    sunset: '#f97316',
    coral: '#f97316',
    ocean: '#0369a1'
  };

  return (
    <View style={[sizeStyles[size], style]}>
      <Svg viewBox="0 0 120 60" width="100%" height="100%">
        {/* Traditional Polynesian wave patterns */}
        <Path d="M0 30 Q15 15 30 30 T60 30 T90 30 T120 30" 
              stroke={colors[color]} 
              strokeWidth="3" 
              fill="none" />
        <Path d="M0 40 Q15 25 30 40 T60 40 T90 40 T120 40" 
              stroke={colors[color]} 
              strokeWidth="2" 
              opacity="0.7" 
              fill="none" />
        <Path d="M0 20 Q15 5 30 20 T60 20 T90 20 T120 20" 
              stroke={colors[color]} 
              strokeWidth="2" 
              opacity="0.7" 
              fill="none" />
      </Svg>
    </View>
  );
};

// Traditional Tiare flower pattern
export const TiarePattern: React.FC<PatternProps> = ({ 
  size = 'md', 
  color = 'coral',
  style = {} 
}) => {
  const sizeStyles = {
    sm: { width: 32, height: 32 },
    md: { width: 64, height: 64 },
    lg: { width: 96, height: 96 }
  };

  const colors = {
    primary: '#0891b2',
    sunset: '#f97316',
    coral: '#f97316',
    ocean: '#0369a1'
  };

  return (
    <View style={[sizeStyles[size], style]}>
      <Svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* Traditional Tiare Tahiti flower */}
        <G>
          {/* Flower center */}
          <Circle cx="50" cy="50" r="8" fill={colors[color]} opacity="0.8" />
          
          {/* Petals */}
          <Ellipse cx="50" cy="30" rx="6" ry="15" fill={colors[color]} />
          <Ellipse cx="70" cy="50" rx="15" ry="6" fill={colors[color]} />
          <Ellipse cx="50" cy="70" rx="6" ry="15" fill={colors[color]} />
          <Ellipse cx="30" cy="50" rx="15" ry="6" fill={colors[color]} />
          
          {/* Diagonal petals */}
          <Ellipse cx="65" cy="35" rx="10" ry="4" fill={colors[color]} transform="rotate(45 65 35)" />
          <Ellipse cx="65" cy="65" rx="10" ry="4" fill={colors[color]} transform="rotate(-45 65 65)" />
          <Ellipse cx="35" cy="65" rx="10" ry="4" fill={colors[color]} transform="rotate(45 35 65)" />
          <Ellipse cx="35" cy="35" rx="10" ry="4" fill={colors[color]} transform="rotate(-45 35 35)" />
          
          {/* Inner details */}
          <Circle cx="50" cy="50" r="4" fill={colors[color]} opacity="0.9" />
          <Circle cx="50" cy="50" r="2" fill="white" opacity="0.8" />
        </G>
      </Svg>
    </View>
  );
};

// Traditional spear pattern (representing strength)
export const SpearPattern: React.FC<PatternProps> = ({ 
  size = 'md', 
  color = 'sunset',
  style = {} 
}) => {
  const sizeStyles = {
    sm: { width: 16, height: 64 },
    md: { width: 24, height: 96 },
    lg: { width: 32, height: 128 }
  };

  const colors = {
    primary: '#0891b2',
    sunset: '#f97316',
    coral: '#f97316',
    ocean: '#0369a1'
  };

  return (
    <View style={[sizeStyles[size], style]}>
      <Svg viewBox="0 0 20 100" width="100%" height="100%">
        {/* Traditional Polynesian spear */}
        <G>
          {/* Spear tip */}
          <Path d="M10 5 L15 20 L10 18 L5 20 Z" fill={colors[color]} />
          
          {/* Spear shaft */}
          <Path d="M9 20 L11 20 L11 90 L9 90 Z" fill={colors[color]} />
          
          {/* Traditional bindings */}
          <Path d="M7 25 L13 25 L13 27 L7 27 Z" fill={colors[color]} opacity="0.8" />
          <Path d="M7 35 L13 35 L13 37 L7 37 Z" fill={colors[color]} opacity="0.8" />
          <Path d="M7 45 L13 45 L13 47 L7 47 Z" fill={colors[color]} opacity="0.8" />
          <Path d="M7 55 L13 55 L13 57 L7 57 Z" fill={colors[color]} opacity="0.8" />
          <Path d="M7 65 L13 65 L13 67 L7 67 Z" fill={colors[color]} opacity="0.8" />
          <Path d="M7 75 L13 75 L13 77 L7 77 Z" fill={colors[color]} opacity="0.8" />
          
          {/* Spear end decoration */}
          <Path d="M10 90 L12 95 L10 92 L8 95 Z" fill={colors[color]} />
        </G>
      </Svg>
    </View>
  );
};

// Composite pattern component
export const TahitianBorder: React.FC<{ style?: any }> = ({ style = {} }) => {
  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16
    }, style]}>
      <TapaPattern size="sm" color="coral" />
      <WavePattern size="sm" color="ocean" />
      <TiarePattern size="sm" color="sunset" />
      <WavePattern size="sm" color="ocean" />
      <TapaPattern size="sm" color="coral" />
    </View>
  );
};

export default {
  TapaPattern,
  WavePattern,
  TiarePattern,
  SpearPattern,
  TahitianBorder
};