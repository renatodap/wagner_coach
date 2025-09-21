// BottomNavigation Component Tests

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BottomNavigation } from './BottomNavigation';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('BottomNavigation', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  describe('Navigation Icon Rendering', () => {
    it('should display nutrition icon in bottom nav', () => {
      render(<BottomNavigation />);

      // Check for nutrition icon or text
      const nutritionLink = screen.getByLabelText(/nutrition/i);
      expect(nutritionLink).toBeInTheDocument();
    });

    it('should display all navigation icons', () => {
      render(<BottomNavigation />);

      // Check for all expected navigation items
      expect(screen.getByLabelText(/home/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/workouts/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nutrition/i)).toBeInTheDocument(); // NEW
      expect(screen.getByLabelText(/coach/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/progress/i)).toBeInTheDocument();
    });

    it('should have correct icon for nutrition', () => {
      render(<BottomNavigation />);

      const nutritionLink = screen.getByLabelText(/nutrition/i);

      // Check if it has an icon element
      const icon = nutritionLink.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('should navigate to /nutrition when clicked', async () => {
      render(<BottomNavigation />);

      const nutritionLink = screen.getByLabelText(/nutrition/i);
      await userEvent.click(nutritionLink);

      expect(mockPush).toHaveBeenCalledWith('/nutrition');
    });

    it('should navigate to correct paths for all items', async () => {
      render(<BottomNavigation />);

      // Test each navigation item
      const navigationItems = [
        { label: /home/i, path: '/' },
        { label: /workouts/i, path: '/workouts' },
        { label: /nutrition/i, path: '/nutrition' },
        { label: /coach/i, path: '/coach' },
        { label: /progress/i, path: '/progress' },
      ];

      for (const item of navigationItems) {
        const link = screen.getByLabelText(item.label);
        await userEvent.click(link);
        expect(mockPush).toHaveBeenCalledWith(item.path);
      }
    });
  });

  describe('Active State Highlighting', () => {
    it('should highlight nutrition icon when on nutrition pages', () => {
      (usePathname as jest.Mock).mockReturnValue('/nutrition');

      render(<BottomNavigation />);

      const nutritionLink = screen.getByLabelText(/nutrition/i);

      // Check for active state (could be a class, aria-current, or style)
      expect(nutritionLink).toHaveClass('active');
      // or
      expect(nutritionLink).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight correct icon based on current path', () => {
      const paths = [
        { path: '/', label: /home/i },
        { path: '/workouts', label: /workouts/i },
        { path: '/nutrition', label: /nutrition/i },
        { path: '/nutrition/add', label: /nutrition/i }, // Sub-pages
        { path: '/coach', label: /coach/i },
        { path: '/progress', label: /progress/i },
      ];

      paths.forEach(({ path, label }) => {
        (usePathname as jest.Mock).mockReturnValue(path);

        const { rerender } = render(<BottomNavigation />);

        const link = screen.getByLabelText(label);
        expect(link).toHaveClass('active');

        rerender(<BottomNavigation />);
      });
    });

    it('should not highlight nutrition when on other pages', () => {
      (usePathname as jest.Mock).mockReturnValue('/workouts');

      render(<BottomNavigation />);

      const nutritionLink = screen.getByLabelText(/nutrition/i);
      expect(nutritionLink).not.toHaveClass('active');
    });
  });

  describe('Responsive Behavior', () => {
    it('should be positioned at bottom of viewport', () => {
      render(<BottomNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('fixed');
      expect(nav).toHaveClass('bottom-0');
    });

    it('should span full width on mobile', () => {
      render(<BottomNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('w-full');
    });

    it('should have proper z-index to stay above content', () => {
      render(<BottomNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('z-50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<BottomNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');

      const nutritionLink = screen.getByLabelText(/nutrition/i);
      expect(nutritionLink).toHaveAttribute('aria-label', expect.stringContaining('Nutrition'));
    });

    it('should be keyboard navigable', async () => {
      render(<BottomNavigation />);

      const nutritionLink = screen.getByLabelText(/nutrition/i);

      // Tab to the element
      nutritionLink.focus();
      expect(nutritionLink).toHaveFocus();

      // Press Enter to navigate
      fireEvent.keyDown(nutritionLink, { key: 'Enter', code: 'Enter' });
      expect(mockPush).toHaveBeenCalledWith('/nutrition');
    });

    it('should have proper role attributes', () => {
      render(<BottomNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();

      // Each link should be a button or link role
      const links = screen.getAllByRole('button');
      expect(links.length).toBeGreaterThanOrEqual(5); // At least 5 nav items
    });
  });

  describe('Visual Feedback', () => {
    it('should show hover state on nutrition icon', async () => {
      render(<BottomNavigation />);

      const nutritionLink = screen.getByLabelText(/nutrition/i);

      // Simulate hover
      fireEvent.mouseEnter(nutritionLink);

      // Check for hover styles (implementation specific)
      expect(nutritionLink).toHaveClass('hover:bg-gray-100');
    });

    it('should show pressed state on click', async () => {
      render(<BottomNavigation />);

      const nutritionLink = screen.getByLabelText(/nutrition/i);

      // Simulate press
      fireEvent.mouseDown(nutritionLink);

      // Check for active/pressed styles
      expect(nutritionLink).toHaveClass('active:scale-95');
    });
  });

  describe('Icon Order', () => {
    it('should display nutrition icon in correct position', () => {
      render(<BottomNavigation />);

      const allLinks = screen.getAllByRole('button');
      const labels = allLinks.map(link => link.getAttribute('aria-label'));

      // Verify nutrition is in the expected position (e.g., third)
      expect(labels).toEqual([
        expect.stringContaining('Home'),
        expect.stringContaining('Workouts'),
        expect.stringContaining('Nutrition'),
        expect.stringContaining('Coach'),
        expect.stringContaining('Progress'),
      ]);
    });
  });
});