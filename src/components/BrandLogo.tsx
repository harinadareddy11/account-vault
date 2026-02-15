import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Animated } from 'react-native';

interface BrandLogoProps {
  serviceName: string;
  size?: number;
  fallbackEmoji?: string;
  showBorder?: boolean;
}

export default function BrandLogo({ 
  serviceName, 
  size = 40, 
  fallbackEmoji = '📦',
  showBorder = false 
}: BrandLogoProps) {
  
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  // 🔥 EXPANDED FUZZY MAPPING (Recruiter-grade dictionary)
  const domainMap = useMemo(() => ({
    // Typos & Shortcuts
    'github': 'github.com', 'gitHub': 'github.com', 'gitub': 'github.com', 'gh': 'github.com',
    'instgram': 'instagram.com', 'insta': 'instagram.com', 'ig': 'instagram.com',
    'faceook': 'facebook.com', 'fb': 'facebook.com',
    'linkdin': 'linkedin.com', 'linked in': 'linkedin.com',
    'yt': 'youtube.com', 'youtub': 'youtube.com',
    
    // Cloud & Infrastructure
    'aws': 'aws.amazon.com', 'amazon web services': 'aws.amazon.com', 'aws cloud': 'aws.amazon.com',
    'gcp': 'cloud.google.com', 'google cloud': 'cloud.google.com',
    'azure': 'azure.microsoft.com', 'digital ocean': 'digitalocean.com', 'do': 'digitalocean.com',
    
    // Dev Tools
    'openai': 'openai.com', 'chatgpt': 'openai.com', 'gpt': 'openai.com',
    'vscode': 'visualstudio.com', 'vsc': 'visualstudio.com',
    'supabase': 'supabase.com', 'firebase': 'firebase.google.com',
    'npm': 'npmjs.com', 'pnpm': 'pnpm.io', 'yarn': 'yarnpkg.com',
    
    // Payments
    'stripe': 'stripe.com', 'paypal': 'paypal.com', 'razorpay': 'razorpay.com'
  }), []);

  // 🔥 ADVANCED NORMALIZATION PIPELINE
  const getNormalizedDomain = useCallback((name: string) => {
    // 1. Basic cleaning: lower, trim, remove internal double spaces
    let clean = name.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // 2. Remove common developer suffixes that break domain lookups
    // e.g., "Python 3", "Node.js", "React Native"
    clean = clean.replace(/\s(v?\d+|js|native|cloud|api|dev|app)$/g, '');

    // 3. Check expanded fuzzy map
    if (domainMap[clean as keyof typeof domainMap]) {
      return domainMap[clean as keyof typeof domainMap];
    }

    // 4. Handle Subdomains (e.g., "console.aws" -> "aws")
    if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts.length > 1) return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }

    // 5. Final Slugging: Remove all non-alphanumeric and append .com
    const slug = clean.replace(/[^a-z0-9]/g, '');
    return slug ? `${slug}.com` : 'unknown.com';
  }, [domainMap]);

  const domain = useMemo(() => getNormalizedDomain(serviceName), [serviceName, getNormalizedDomain]);

  const logoSources = useMemo(() => [
    `https://logo.clearbit.com/${domain}?size=${size * 2}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`,
    `https://favicon.im/api/${domain}?size=${size * 2}`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico` // Reliable 4th fallback
  ], [domain, size]);

  // Handle errors by cycling through sources
  const handleImageError = useCallback(() => {
    if (currentSourceIndex < logoSources.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  }, [currentSourceIndex, logoSources.length]);

  // Smooth fade-in when image loads
  useEffect(() => {
    if (!hasError) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentSourceIndex, hasError, fadeAnim]);

  if (hasError) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius: size * 0.22, borderWidth: showBorder ? 1 : 0 }]}>
        <Text style={{ fontSize: size * 0.55 }}>{fallbackEmoji}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ width: size, height: size, opacity: fadeAnim }}>
      <Image
        source={{ uri: logoSources[currentSourceIndex] }}
        style={[styles.logo, { width: size, height: size, borderRadius: size * 0.22, borderWidth: showBorder ? 1 : 0 }]}
        resizeMode="contain"
        onError={handleImageError}
      />
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  logo: { backgroundColor: '#fff', borderColor: '#1e293b', overflow: 'hidden' },
  fallback: { backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderColor: '#334155' },
});
