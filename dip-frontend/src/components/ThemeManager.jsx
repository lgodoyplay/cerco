import React, { useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { themePalettes } from '../utils/themeColors';

const ThemeManager = () => {
  const { appearance } = useSettings();

  useEffect(() => {
    if (!appearance) return;

    // 1. Apply Theme Mode (Dark/Light)
    if (appearance.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }

    // 2. Apply Primary Color Palette
    const palette = themePalettes[appearance.primaryColor] || themePalettes.blue;
    
    Object.entries(palette.colors).forEach(([shade, value]) => {
      document.documentElement.style.setProperty(`--color-federal-${shade}`, value);
    });

    // 3. Apply Compact Mode
    if (appearance.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }

  }, [appearance]);

  return null;
};

export default ThemeManager;
