import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PhotoCapture from './PhotoCapture';
import { PhotoCaptureProps } from '@/types/nutrition';

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn();
global.navigator.mediaDevices = { getUserMedia: mockGetUserMedia } as any;

describe('PhotoCapture Component', () => {
  const mockOnPhotoCapture = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps: PhotoCaptureProps = {
    onPhotoCapture: mockOnPhotoCapture,
    onCancel: mockOnCancel,
    isProcessing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
  });

  // Rendering Tests
  test('should render camera interface with capture button', () => {
    render(<PhotoCapture {...defaultProps} />);
    expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
  });

  test('should render file upload option', () => {
    render(<PhotoCapture {...defaultProps} />);
    expect(screen.getByLabelText(/upload/i)).toBeInTheDocument();
  });

  test('should render drag and drop zone', () => {
    render(<PhotoCapture {...defaultProps} />);
    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
  });

  test('should show processing state when isProcessing=true', () => {
    render(<PhotoCapture {...defaultProps} isProcessing={true} />);
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  test('should disable capture button during processing', () => {
    render(<PhotoCapture {...defaultProps} isProcessing={true} />);
    expect(screen.getByRole('button', { name: /capture/i })).toBeDisabled();
  });

  // Camera Functionality Tests
  test('should request camera permissions on mount', async () => {
    render(<PhotoCapture {...defaultProps} />);
    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'environment' },
        audio: false
      });
    });
  });

  test('should display error message when camera access denied', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
    render(<PhotoCapture {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/camera access denied/i)).toBeInTheDocument();
    });
  });

  test('should show camera preview when permissions granted', async () => {
    render(<PhotoCapture {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('camera-preview')).toBeInTheDocument();
    });
  });

  test('should call onPhotoCapture with image data when capture clicked', async () => {
    render(<PhotoCapture {...defaultProps} />);
    await waitFor(() => screen.getByRole('button', { name: /capture/i }));

    const captureButton = screen.getByRole('button', { name: /capture/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(mockOnPhotoCapture).toHaveBeenCalledWith(expect.stringContaining('data:image'));
    });
  });

  test('should provide retake option after capture', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const captureButton = screen.getByRole('button', { name: /capture/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retake/i })).toBeInTheDocument();
    });
  });

  // File Upload Tests
  test('should accept JPEG files via file input', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const fileInput = screen.getByLabelText(/upload/i);
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnPhotoCapture).toHaveBeenCalled();
    });
  });

  test('should accept PNG files via file input', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const fileInput = screen.getByLabelText(/upload/i);
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnPhotoCapture).toHaveBeenCalled();
    });
  });

  test('should reject non-image files with error message', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const fileInput = screen.getByLabelText(/upload/i);
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/only image files/i)).toBeInTheDocument();
    });
  });

  test('should show error for files larger than 10MB', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const fileInput = screen.getByLabelText(/upload/i);
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });

    Object.defineProperty(fileInput, 'files', { value: [largeFile] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    });
  });

  test('should compress large images automatically', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const fileInput = screen.getByLabelText(/upload/i);
    const file = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });

    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/compressing/i)).toBeInTheDocument();
    });
  });

  // Drag & Drop Tests
  test('should highlight drop zone on drag over', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const dropZone = screen.getByText(/drag.*drop/i).parentElement;

    fireEvent.dragOver(dropZone!);
    expect(dropZone).toHaveClass('drag-over');
  });

  test('should accept dropped image files', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const dropZone = screen.getByText(/drag.*drop/i).parentElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(mockOnPhotoCapture).toHaveBeenCalled();
    });
  });

  test('should reject dropped non-image files', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const dropZone = screen.getByText(/drag.*drop/i).parentElement;
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText(/only image files/i)).toBeInTheDocument();
    });
  });

  test('should handle multiple files by taking first image', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const dropZone = screen.getByText(/drag.*drop/i).parentElement;
    const files = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];

    fireEvent.drop(dropZone!, {
      dataTransfer: { files },
    });

    await waitFor(() => {
      expect(mockOnPhotoCapture).toHaveBeenCalledTimes(1);
    });
  });

  test('should show preview of dropped image', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const dropZone = screen.getByText(/drag.*drop/i).parentElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
    });
  });

  // Error Handling Tests
  test('should handle camera initialization errors', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Camera not found'));
    render(<PhotoCapture {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/camera not found/i)).toBeInTheDocument();
    });
  });

  test('should handle corrupt image file errors', async () => {
    render(<PhotoCapture {...defaultProps} />);
    const fileInput = screen.getByLabelText(/upload/i);
    const corruptFile = new File(['corrupt'], 'corrupt.jpg', { type: 'image/jpeg' });

    Object.defineProperty(fileInput, 'files', { value: [corruptFile] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/failed to process/i)).toBeInTheDocument();
    });
  });

  test('should provide retry mechanism for failed captures', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Temporary error'));
    render(<PhotoCapture {...defaultProps} />);

    await waitFor(() => screen.getByRole('button', { name: /retry/i }));

    mockGetUserMedia.mockResolvedValueOnce({
      getTracks: () => [{ stop: jest.fn() }],
    });

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
    });
  });

  test('should call onCancel when cancel button clicked', () => {
    render(<PhotoCapture {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalled();
  });
});