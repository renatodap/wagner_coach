/**
 * Coach Interface Tests
 * Testing the chat UI and user interactions
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createClient } from '@/lib/supabase/client';
import CoachClient from '@/app/coach/CoachClient';
import BottomNavigation from '@/app/components/BottomNavigation';

// Test data
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com'
};

const mockConversation = {
  id: 'conv-123',
  messages: [
    {
      id: 'msg-1',
      role: 'assistant' as const,
      content: 'Hello! I\'m your AI fitness coach. How can I help you today?',
      timestamp: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: 'msg-2',
      role: 'user' as const,
      content: 'I want to improve my bench press',
      timestamp: new Date('2024-01-01T10:01:00Z')
    }
  ]
};

describe('Coach Interface', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeEach(async () => {
    supabase = createClient();

    // Set up authenticated user
    await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
  });

  afterEach(async () => {
    await supabase.auth.signOut();
  });

  describe('Navigation Integration', () => {
    it('should render coach tab in bottom navigation', () => {
      render(<BottomNavigation />);

      const coachTab = screen.getByRole('link', { name: /coach/i });
      expect(coachTab).toBeInTheDocument();
      expect(coachTab).toHaveAttribute('href', '/coach');
    });

    it('should highlight coach tab when on coach page', () => {
      // Mock the pathname
      jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue('/coach');

      render(<BottomNavigation />);

      const coachTab = screen.getByRole('link', { name: /coach/i });
      expect(coachTab).toHaveClass('text-iron-orange');
    });
  });

  describe('Initial Load', () => {
    it('should display welcome message for first-time users', async () => {
      // Clear any existing conversations
      await supabase
        .from('ai_conversations')
        .delete()
        .eq('user_id', mockUser.id);

      render(<CoachClient userId={mockUser.id} />);

      await waitFor(() => {
        expect(screen.getByText(/welcome to your ai fitness coach/i)).toBeInTheDocument();
        expect(screen.getByText(/i'm here to help you achieve your fitness goals/i)).toBeInTheDocument();
      });

      // Check for quick setup prompts
      expect(screen.getByText(/tell me about your goals/i)).toBeInTheDocument();
      expect(screen.getByText(/what's your experience level/i)).toBeInTheDocument();
    });

    it('should load conversation history for returning users', async () => {
      // Insert test conversation
      await supabase
        .from('ai_conversations')
        .insert({
          user_id: mockUser.id,
          messages: mockConversation.messages,
          created_at: new Date().toISOString()
        });

      render(<CoachClient userId={mockUser.id} />);

      await waitFor(() => {
        // Check previous messages appear
        expect(screen.getByText(mockConversation.messages[0].content)).toBeInTheDocument();
        expect(screen.getByText(mockConversation.messages[1].content)).toBeInTheDocument();
      });
    });

    it('should display message input and send button', () => {
      render(<CoachClient userId={mockUser.id} />);

      expect(screen.getByPlaceholderText(/ask your coach/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });
  });

  describe('Message Flow', () => {
    it('should send user message and receive AI response', async () => {
      render(<CoachClient userId={mockUser.id} />);

      const input = screen.getByPlaceholderText(/ask your coach/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Type and send message
      await userEvent.type(input, 'What should I do for chest day?');
      await userEvent.click(sendButton);

      // Verify user message appears
      await waitFor(() => {
        expect(screen.getByText('What should I do for chest day?')).toBeInTheDocument();
      });

      // Wait for AI response (with typing indicator first)
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();

      // Wait for actual response
      await waitFor(() => {
        expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
        expect(screen.getByText(/chest/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should handle streaming responses correctly', async () => {
      render(<CoachClient userId={mockUser.id} />);

      const input = screen.getByPlaceholderText(/ask your coach/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await userEvent.type(input, 'Create a detailed workout plan');
      await userEvent.click(sendButton);

      // Check for progressive text rendering
      let previousLength = 0;
      const checkProgressive = async () => {
        await waitFor(() => {
          const aiMessages = screen.getAllByTestId('ai-message');
          const lastMessage = aiMessages[aiMessages.length - 1];
          const currentLength = lastMessage.textContent?.length || 0;

          expect(currentLength).toBeGreaterThan(previousLength);
          previousLength = currentLength;
        });
      };

      // Check multiple times for progressive rendering
      await checkProgressive();
      await new Promise(resolve => setTimeout(resolve, 500));
      await checkProgressive();
    });

    it('should maintain conversation context across messages', async () => {
      render(<CoachClient userId={mockUser.id} />);

      const input = screen.getByPlaceholderText(/ask your coach/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // First message about goals
      await userEvent.type(input, 'My goal is to build muscle');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('My goal is to build muscle')).toBeInTheDocument();
      });

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText(/muscle/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Clear input and send follow-up
      await userEvent.clear(input);
      await userEvent.type(input, 'How many days per week should I train?');
      await userEvent.click(sendButton);

      // Verify context-aware response (should reference muscle building)
      await waitFor(() => {
        const aiMessages = screen.getAllByTestId('ai-message');
        const lastMessage = aiMessages[aiMessages.length - 1];
        expect(lastMessage.textContent).toMatch(/muscle building|hypertrophy|4-5 days/i);
      }, { timeout: 10000 });
    });

    it('should disable input while processing', async () => {
      render(<CoachClient userId={mockUser.id} />);

      const input = screen.getByPlaceholderText(/ask your coach/i) as HTMLInputElement;
      const sendButton = screen.getByRole('button', { name: /send/i }) as HTMLButtonElement;

      await userEvent.type(input, 'Test message');
      await userEvent.click(sendButton);

      // Check input and button are disabled
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();

      // Wait for response to complete
      await waitFor(() => {
        expect(input).not.toBeDisabled();
        expect(sendButton).not.toBeDisabled();
      }, { timeout: 10000 });
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action buttons', () => {
      render(<CoachClient userId={mockUser.id} />);

      expect(screen.getByRole('button', { name: /analyze last workout/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /plan next session/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /check progress/i })).toBeInTheDocument();
    });

    it('should send predefined message when quick action clicked', async () => {
      render(<CoachClient userId={mockUser.id} />);

      const analyzeButton = screen.getByRole('button', { name: /analyze last workout/i });
      await userEvent.click(analyzeButton);

      // Verify the predefined message is sent
      await waitFor(() => {
        expect(screen.getByText(/analyze my last workout/i)).toBeInTheDocument();
      });

      // Wait for AI response about workout analysis
      await waitFor(() => {
        const aiMessages = screen.getAllByTestId('ai-message');
        const lastMessage = aiMessages[aiMessages.length - 1];
        expect(lastMessage.textContent).toMatch(/workout|analysis|performance/i);
      }, { timeout: 10000 });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      // Mock API failure
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));

      render(<CoachClient userId={mockUser.id} />);

      const input = screen.getByPlaceholderText(/ask your coach/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await userEvent.type(input, 'Test message');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/sorry, something went wrong/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('should handle rate limiting gracefully', async () => {
      // Mock rate limit response
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' })
      } as Response);

      render(<CoachClient userId={mockUser.id} />);

      const input = screen.getByPlaceholderText(/ask your coach/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await userEvent.type(input, 'Test message');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/you've reached the message limit/i)).toBeInTheDocument();
        expect(screen.getByText(/please try again later/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Experience', () => {
    it('should adapt layout for mobile viewport', () => {
      // Set mobile viewport
      window.innerWidth = 375;
      window.innerHeight = 667;

      render(<CoachClient userId={mockUser.id} />);

      // Check for mobile-optimized elements
      const chatContainer = screen.getByTestId('chat-container');
      expect(chatContainer).toHaveClass('h-screen');

      const inputContainer = screen.getByTestId('input-container');
      expect(inputContainer).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
    });

    it('should handle touch interactions correctly', async () => {
      render(<CoachClient userId={mockUser.id} />);

      const input = screen.getByPlaceholderText(/ask your coach/i);

      // Simulate touch event
      fireEvent.touchStart(input);
      fireEvent.touchEnd(input);

      // Input should be focused
      expect(input).toHaveFocus();
    });
  });

  describe('Conversation Management', () => {
    it('should auto-scroll to latest message', async () => {
      render(<CoachClient userId={mockUser.id} />);

      const scrollContainer = screen.getByTestId('messages-container');
      const scrollSpy = jest.spyOn(scrollContainer, 'scrollTop', 'set');

      const input = screen.getByPlaceholderText(/ask your coach/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await userEvent.type(input, 'Test message');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(scrollSpy).toHaveBeenCalled();
      });
    });

    it('should persist conversation to database', async () => {
      render(<CoachClient userId={mockUser.id} />);

      const input = screen.getByPlaceholderText(/ask your coach/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await userEvent.type(input, 'Test persistence');
      await userEvent.click(sendButton);

      await waitFor(async () => {
        const { data } = await supabase
          .from('ai_conversations')
          .select('messages')
          .eq('user_id', mockUser.id)
          .single();

        const messages = data?.messages as any[];
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.content).toBe('Test persistence');
      });
    });
  });
});