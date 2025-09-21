// PhotoUpload Component Tests

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PhotoUpload } from './PhotoUpload';

describe('PhotoUpload', () => {
  const mockOnImageSelect = jest.fn();
  const mockOnImageRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render file input button', () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      expect(screen.getByText(/upload photo/i)).toBeInTheDocument();
    });

    it('should display accepted file types hint', () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      expect(screen.getByText(/jpeg, png, webp/i)).toBeInTheDocument();
    });

    it('should show upload icon', () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const uploadIcon = screen.getByTestId('upload-icon');
      expect(uploadIcon).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should accept JPEG images', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['image'], 'meal.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      expect(mockOnImageSelect).toHaveBeenCalledWith(file);
    });

    it('should accept PNG images', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['image'], 'meal.png', { type: 'image/png' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      expect(mockOnImageSelect).toHaveBeenCalledWith(file);
    });

    it('should accept WebP images', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['image'], 'meal.webp', { type: 'image/webp' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      expect(mockOnImageSelect).toHaveBeenCalledWith(file);
    });

    it('should reject non-image files', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['document'], 'document.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      expect(mockOnImageSelect).not.toHaveBeenCalled();
      expect(screen.getByText(/please select an image file/i)).toBeInTheDocument();
    });

    it('should reject files over 10MB', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          maxSizeInBytes={10485760} // 10MB
        />
      );

      const largeFile = new File(['x'.repeat(11_000_000)], 'large.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, largeFile);

      expect(mockOnImageSelect).not.toHaveBeenCalled();
      expect(screen.getByText(/file size must be less than 10MB/i)).toBeInTheDocument();
    });

    it('should show image preview after selection', async () => {
      const { rerender } = render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['image'], 'meal.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      // Simulate preview URL creation
      URL.createObjectURL = jest.fn(() => 'blob:preview-url');

      rerender(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      await waitFor(() => {
        const preview = screen.getByAltText(/meal preview/i);
        expect(preview).toBeInTheDocument();
      });
    });

    it('should display file name and size', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['x'.repeat(1024)], 'meal.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('meal.jpg')).toBeInTheDocument();
        expect(screen.getByText(/1\.0 KB/i)).toBeInTheDocument();
      });
    });
  });

  describe('Image Preview', () => {
    it('should display selected image', async () => {
      URL.createObjectURL = jest.fn(() => 'blob:preview-url');

      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['image'], 'meal.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      await waitFor(() => {
        const preview = screen.getByAltText(/meal preview/i);
        expect(preview).toHaveAttribute('src', 'blob:preview-url');
      });
    });

    it('should show loading state during upload', () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          isProcessing={true}
        />
      );

      expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should allow image removal', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['image'], 'meal.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      const removeButton = await screen.findByTestId('remove-image');
      await userEvent.click(removeButton);

      expect(mockOnImageRemove).toHaveBeenCalled();
    });

    it('should clear preview on removal', async () => {
      const { rerender } = render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['image'], 'meal.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      const removeButton = await screen.findByTestId('remove-image');
      await userEvent.click(removeButton);

      rerender(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      expect(screen.queryByAltText(/meal preview/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error for oversized files', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          maxSizeInBytes={1024} // 1KB limit
        />
      );

      const file = new File(['x'.repeat(2048)], 'large.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      expect(screen.getByText(/file size must be less than/i)).toBeInTheDocument();
    });

    it('should show error for invalid file types', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['text'], 'document.txt', { type: 'text/plain' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      expect(screen.getByText(/please select an image file/i)).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          error="Upload failed. Please try again."
        />
      );

      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();

      // Should still be able to select a new file
      const file = new File(['image'], 'meal.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      expect(mockOnImageSelect).toHaveBeenCalledWith(file);
    });

    it('should display custom error messages', () => {
      const customError = 'Network error occurred';

      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
          error={customError}
        />
      );

      expect(screen.getByText(customError)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible file input', () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('aria-label', 'Upload meal photo');
    });

    it('should announce errors to screen readers', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const file = new File(['text'], 'document.txt', { type: 'text/plain' });
      const input = screen.getByTestId('file-input');

      await userEvent.upload(input, file);

      const error = screen.getByText(/please select an image file/i);
      expect(error).toHaveAttribute('role', 'alert');
    });

    it('should be keyboard navigable', async () => {
      render(
        <PhotoUpload
          onImageSelect={mockOnImageSelect}
          onImageRemove={mockOnImageRemove}
        />
      );

      const uploadButton = screen.getByText(/upload photo/i).closest('button');

      // Tab to button
      await userEvent.tab();
      expect(uploadButton).toHaveFocus();

      // Enter to activate
      await userEvent.keyboard('{Enter}');
      // File dialog would open (can't test actual dialog)
    });
  });
});