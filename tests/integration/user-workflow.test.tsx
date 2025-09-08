import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock contexts
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="auth-provider">{children}</div>
)

const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="progress-provider">{children}</div>
)

// Mock components
const CoursePage: React.FC = () => (
  <div>
    <h1>Courses</h1>
    <div>Basic Tahitian</div>
    <div>Intermediate Tahitian</div>
    <div>33%</div>
    <div>0%</div>
    <button>Beginner</button>
  </div>
)

const LessonPage: React.FC<{ lessonId: string }> = ({ lessonId }) => (
  <div>
    <h1>Greetings</h1>
    <p>Learn basic greetings in Tahitian</p>
    <button>Play</button>
    <div>How do you say "Hello" in Tahitian?</div>
    <button>Ia ora na</button>
    <button>Submit Answer</button>
  </div>
)

const DashboardPage: React.FC = () => (
  <div>
    <h1>Dashboard</h1>
    <div>Welcome back</div>
  </div>
)

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/courses',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'courses.title': 'Courses',
      'courses.beginner': 'Beginner',
      'courses.intermediate': 'Intermediate',
      'courses.advanced': 'Advanced',
      'lessons.title': 'Lesson',
      'lessons.complete': 'Complete Lesson',
      'lessons.next': 'Next Lesson',
      'lessons.previous': 'Previous Lesson',
      'dashboard.welcome': 'Welcome back',
      'dashboard.progress': 'Your Progress',
      'dashboard.continue': 'Continue Learning',
      'progress.completed': 'Completed',
      'progress.inProgress': 'In Progress',
      'audio.play': 'Play',
      'audio.pause': 'Pause',
      'quiz.submit': 'Submit Answer',
      'quiz.correct': 'Correct!',
      'quiz.incorrect': 'Try again',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock audio element
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  currentTime: 0,
  duration: 100,
  paused: true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}

global.Audio = jest.fn().mockImplementation(() => mockAudio)

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <ProgressProvider>
        {children}
      </ProgressProvider>
    </AuthProvider>
  )
}

// Mock data
const mockUser = {
  id: '1',
  email: 'student@example.com',
  name: 'Test Student',
  role: 'student',
}

const mockCourses = [
  {
    id: '1',
    title: 'Basic Tahitian',
    description: 'Learn basic Tahitian phrases',
    difficulty: 'beginner',
    lessons: ['1', '2', '3'],
    progress: 33,
  },
  {
    id: '2',
    title: 'Intermediate Tahitian',
    description: 'Expand your Tahitian vocabulary',
    difficulty: 'intermediate',
    lessons: ['4', '5', '6'],
    progress: 0,
  },
]

const mockLesson = {
  id: '1',
  title: 'Greetings',
  content: 'Learn basic greetings in Tahitian',
  audioUrl: '/audio/lesson1.mp3',
  quiz: {
    question: 'How do you say "Hello" in Tahitian?',
    options: ['Ia ora na', 'Mauruuru', 'Nana'],
    correctAnswer: 0,
  },
  completed: false,
}

describe('User Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Course Navigation Workflow', () => {
    it('should display courses and allow navigation', async () => {
      const user = userEvent.setup()
      
      // Mock courses API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: mockCourses }),
      })

      render(
        <TestWrapper>
          <CoursePage />
        </TestWrapper>
      )

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Basic Tahitian')).toBeInTheDocument()
        expect(screen.getByText('Intermediate Tahitian')).toBeInTheDocument()
      })

      // Check progress display
      expect(screen.getByText('33%')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()

      // Click on a course
      await user.click(screen.getByText('Basic Tahitian'))

      // Check navigation
      expect(mockPush).toHaveBeenCalledWith('/courses/1')
    })

    it('should filter courses by difficulty', async () => {
      const user = userEvent.setup()
      
      // Mock courses API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courses: mockCourses }),
      })

      render(
        <TestWrapper>
          <CoursePage />
        </TestWrapper>
      )

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Basic Tahitian')).toBeInTheDocument()
      })

      // Filter by beginner
      const beginnerFilter = screen.getByRole('button', { name: /beginner/i })
      await user.click(beginnerFilter)

      // Check that only beginner courses are shown
      expect(screen.getByText('Basic Tahitian')).toBeInTheDocument()
      expect(screen.queryByText('Intermediate Tahitian')).not.toBeInTheDocument()
    })
  })

  describe('Lesson Completion Workflow', () => {
    it('should complete a lesson workflow', async () => {
      const user = userEvent.setup()
      
      // Mock lesson API response
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ lesson: mockLesson }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(
        <TestWrapper>
          <LessonPage lessonId="1" />
        </TestWrapper>
      )

      // Wait for lesson to load
      await waitFor(() => {
        expect(screen.getByText('Greetings')).toBeInTheDocument()
        expect(screen.getByText('Learn basic greetings in Tahitian')).toBeInTheDocument()
      })

      // Play audio
      const playButton = screen.getByRole('button', { name: /play/i })
      await user.click(playButton)
      expect(mockAudio.play).toHaveBeenCalled()

      // Answer quiz question
      const quizQuestion = screen.getByText('How do you say "Hello" in Tahitian?')
      expect(quizQuestion).toBeInTheDocument()

      // Select correct answer
      const correctOption = screen.getByText('Ia ora na')
      await user.click(correctOption)

      // Submit answer
      const submitButton = screen.getByRole('button', { name: /submit answer/i })
      await user.click(submitButton)

      // Check for correct feedback
      await waitFor(() => {
        expect(screen.getByText('Correct!')).toBeInTheDocument()
      })

      // Complete lesson
      const completeButton = screen.getByRole('button', { name: /complete lesson/i })
      await user.click(completeButton)

      // Wait for completion API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/lessons/1/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
        })
      })

      // Check navigation to next lesson
      expect(mockPush).toHaveBeenCalledWith('/lessons/2')
    })

    it('should handle incorrect quiz answers', async () => {
      const user = userEvent.setup()
      
      // Mock lesson API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lesson: mockLesson }),
      })

      render(
        <TestWrapper>
          <LessonPage lessonId="1" />
        </TestWrapper>
      )

      // Wait for lesson to load
      await waitFor(() => {
        expect(screen.getByText('Greetings')).toBeInTheDocument()
      })

      // Select incorrect answer
      const incorrectOption = screen.getByText('Mauruuru')
      await user.click(incorrectOption)

      // Submit answer
      const submitButton = screen.getByRole('button', { name: /submit answer/i })
      await user.click(submitButton)

      // Check for incorrect feedback
      await waitFor(() => {
        expect(screen.getByText('Try again')).toBeInTheDocument()
      })

      // Complete button should be disabled
      const completeButton = screen.getByRole('button', { name: /complete lesson/i })
      expect(completeButton).toBeDisabled()
    })
  })

  describe('Dashboard Progress Workflow', () => {
    it('should display user progress and continue learning', async () => {
      const user = userEvent.setup()
      
      // Mock dashboard API responses
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            progress: {
              totalLessons: 10,
              completedLessons: 3,
              currentStreak: 5,
              totalPoints: 150,
            },
            recentActivity: [
              {
                id: '1',
                type: 'lesson_completed',
                lessonTitle: 'Greetings',
                date: '2024-01-15',
              },
            ],
            nextLesson: {
              id: '2',
              title: 'Numbers',
              courseTitle: 'Basic Tahitian',
            },
          }),
        })

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      )

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test Student')).toBeInTheDocument()
      })

      // Check progress display
      expect(screen.getByText('3 / 10')).toBeInTheDocument()
      expect(screen.getByText('5 day streak')).toBeInTheDocument()
      expect(screen.getByText('150 points')).toBeInTheDocument()

      // Check recent activity
      expect(screen.getByText('Greetings')).toBeInTheDocument()

      // Continue learning
      const continueButton = screen.getByRole('button', { name: /continue learning/i })
      await user.click(continueButton)

      // Check navigation to next lesson
      expect(mockPush).toHaveBeenCalledWith('/lessons/2')
    })

    it('should handle empty progress state', async () => {
      // Mock empty progress response
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            progress: {
              totalLessons: 0,
              completedLessons: 0,
              currentStreak: 0,
              totalPoints: 0,
            },
            recentActivity: [],
            nextLesson: null,
          }),
        })

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      )

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test Student')).toBeInTheDocument()
      })

      // Check empty state
      expect(screen.getByText('Start your learning journey')).toBeInTheDocument()
      expect(screen.getByText('Browse Courses')).toBeInTheDocument()
    })
  })

  describe('Cross-Component Integration', () => {
    it('should maintain state across navigation', async () => {
      const user = userEvent.setup()
      
      // Mock API responses for course list and lesson
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ courses: mockCourses }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ lesson: mockLesson }),
        })

      const { rerender } = render(
        <TestWrapper>
          <CoursePage />
        </TestWrapper>
      )

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Basic Tahitian')).toBeInTheDocument()
      })

      // Navigate to lesson
      await user.click(screen.getByText('Basic Tahitian'))

      // Simulate navigation by rerendering with lesson component
      rerender(
        <TestWrapper>
          <LessonPage lessonId="1" />
        </TestWrapper>
      )

      // Wait for lesson to load
      await waitFor(() => {
        expect(screen.getByText('Greetings')).toBeInTheDocument()
      })

      // Check that progress context is maintained
      expect(global.fetch).toHaveBeenCalledWith('/api/lessons/1')
    })

    it('should handle network errors gracefully', async () => {
      // Mock network error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(
        <TestWrapper>
          <CoursePage />
        </TestWrapper>
      )

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/error loading courses/i)).toBeInTheDocument()
      })

      // Check retry button
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
    })
  })
})